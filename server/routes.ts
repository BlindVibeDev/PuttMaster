import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSocketServer } from "./socket";
import { z } from "zod";
import { 
  insertGameSessionSchema, 
  insertGamePlayerSchema,
  insertPlayerCustomizationSchema,
  GameMode
} from "@shared/schema";
import { getUserInfo } from "@replit/repl-auth";

// Validation schemas
const createGameSchema = z.object({
  name: z.string().min(1).max(100),
  hostId: z.number().positive().int(),
  mode: z.enum(['solo', '2player', '3player', '4player', '2v2']),
  courseStyle: z.number().int().min(0).max(5)
});

const joinGameSchema = z.object({
  userId: z.number().positive().int()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Socket.io server
  setupSocketServer(httpServer);

  // === Game Endpoints ===

  // Get all active games
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getActiveGames();
      res.json(games);
    } catch (error) {
      console.error('Error getting games:', error);
      res.status(500).json({ message: 'Failed to get games' });
    }
  });

  // Create a new game
  app.post('/api/games', async (req, res) => {
    try {
      const data = createGameSchema.parse(req.body);

      // Create the game
      const game = await storage.createGameSession({
        name: data.name,
        hostId: data.hostId,
        mode: data.mode as GameMode,
        courseStyle: data.courseStyle
      });

      // Add the host as a player
      await storage.addPlayerToGame({
        gameId: game.id,
        userId: data.hostId,
        team: 0
      });

      res.status(201).json(game);
    } catch (error) {
      console.error('Error creating game:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid game data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create game' });
      }
    }
  });

  // Get a specific game by ID
  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);

      if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID' });
      }

      const game = await storage.getGameById(gameId);

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // Get players for this game
      const players = await storage.getPlayersForGame(gameId);

      res.json({
        ...game,
        players
      });
    } catch (error) {
      console.error('Error getting game:', error);
      res.status(500).json({ message: 'Failed to get game' });
    }
  });

  // Join a game
  app.post('/api/games/:id/join', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);

      if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID' });
      }

      const data = joinGameSchema.parse(req.body);

      // Check if game exists
      const game = await storage.getGameById(gameId);

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // Check if game is full
      const players = await storage.getPlayersForGame(gameId);

      // Determine max players based on game mode
      let maxPlayers = 1;
      switch (game.mode) {
        case 'solo':
          maxPlayers = 1;
          break;
        case '2player':
          maxPlayers = 2;
          break;
        case '3player':
          maxPlayers = 3;
          break;
        case '4player':
        case '2v2':
          maxPlayers = 4;
          break;
      }

      if (players.length >= maxPlayers) {
        return res.status(400).json({ message: 'Game is full' });
      }

      // Check if player already in game
      const existingPlayer = players.find(p => p.userId === data.userId);

      if (existingPlayer) {
        return res.status(400).json({ message: 'Already joined this game' });
      }

      // Determine team (for 2v2 mode)
      let team = 0;
      if (game.mode === '2v2') {
        // Count players on each team
        const team0Count = players.filter(p => p.team === 0).length;
        const team1Count = players.filter(p => p.team === 1).length;

        // Assign to team with fewer players
        team = team0Count <= team1Count ? 0 : 1;
      }

      // Add player to game
      await storage.addPlayerToGame({
        gameId,
        userId: data.userId,
        team
      });

      res.status(200).json({ message: 'Joined game successfully' });
    } catch (error) {
      console.error('Error joining game:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to join game' });
      }
    }
  });

  // Leave a game
  app.delete('/api/games/:id/players/:userId', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      if (isNaN(gameId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid game ID or user ID' });
      }

      // Check if game exists
      const game = await storage.getGameById(gameId);

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // Remove player from game
      await storage.removePlayerFromGame(gameId, userId);

      // If it was the host, delete the game
      if (game.hostId === userId) {
        await storage.deleteGame(gameId);
        return res.status(200).json({ message: 'Game deleted' });
      }

      res.status(200).json({ message: 'Left game successfully' });
    } catch (error) {
      console.error('Error leaving game:', error);
      res.status(500).json({ message: 'Failed to leave game' });
    }
  });

  // === User Endpoints ===

  // Get or create a user
  app.post('/api/users', async (req, res) => {
    try {
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Username is required' });
      }

      // Check if user exists
      let user = await storage.getUserByUsername(username);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          username,
          password: 'guest' // Not actually using passwords for this demo
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Error with user:', error);
      res.status(500).json({ message: 'Failed to process user' });
    }
  });

  // === Auth Endpoints ===

  // Get current authenticated user
  app.get('/api/auth/user', async (req, res) => {
    try {
      // Get authenticated user from Replit Auth
      const user = getUserInfo(req);
      
      // If no user is authenticated
      if (!user || !user.id) {
        return res.status(200).json(null);
      }
      
      // Check if user exists in our database
      const userId = parseInt(user.id);
      
      // Try to get the user record
      let dbUser = await storage.getUser(userId);
      
      // If user doesn't exist in our system yet, create a new record
      if (!dbUser) {
        try {
          log(`Creating new user in database for Replit Auth user ${user.id} (${user.name})`);
          // Use the Replit username for our database
          dbUser = await storage.createUser({
            username: user.name,
            password: 'none' // Not using passwords with Replit Auth
          });
          log(`Created new user record: ${JSON.stringify(dbUser)}`);
        } catch (err) {
          log(`Error creating user record for Replit Auth user: ${err}`);
          // Continue anyway - we'll still return the Replit Auth user info
        }
      }
      
      // Return user info
      return res.status(200).json({
        id: user.id,
        name: user.name,
        username: user.name, // Replit auth provides 'name' which we'll use as username
        bio: '',
        isLoggedIn: true,
        roles: [],
        profileImage: user.profileImage || ''
      });
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      return res.status(200).json(null); // Return null instead of error to simplify client logic
    }
  });
  
  // Logout endpoint (Not used directly - Replit Auth doesn't have a formal logout method)
  app.post('/api/auth/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out' });
  });

  // === Player Customization Endpoints ===

  // Get customization for a user
  app.get('/api/users/:id/customization', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const customization = await storage.getPlayerCustomization(userId);

      if (!customization) {
        return res.status(404).json({ message: 'Customization not found' });
      }

      res.json(customization);
    } catch (error) {
      console.error('Error getting customization:', error);
      res.status(500).json({ message: 'Failed to get customization' });
    }
  });

  // Update customization for a user
  app.put('/api/users/:id/customization', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const data = insertPlayerCustomizationSchema.parse({
        ...req.body,
        userId
      });

      // Check if customization exists
      const existingCustomization = await storage.getPlayerCustomization(userId);

      if (existingCustomization) {
        // Update existing customization
        const updated = await storage.updatePlayerCustomization(userId, {
          ballType: data.ballType,
          clubType: data.clubType
        });

        return res.json(updated);
      }

      // Create new customization
      const customization = await storage.createPlayerCustomization(data);

      res.status(201).json(customization);
    } catch (error) {
      console.error('Error updating customization:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update customization' });
      }
    }
  });

  return httpServer;
}