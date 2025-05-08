import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { gameManager } from './game/gameManager';
import { log } from './vite';
import { PlayerAction, GameState } from '@shared/schema';
import { getPlayerById } from './storage';

// Setup Socket.io server
export function setupSocketServer(httpServer: HTTPServer): void {
  const io = new Server(httpServer);
  
  // Socket middleware to authenticate users
  io.use(async (socket, next) => {
    const { gameId, userId } = socket.handshake.query;
    
    if (!gameId || !userId) {
      return next(new Error('Game ID and User ID are required'));
    }
    
    try {
      // Validate that this is a real user and game
      const player = await getPlayerById(Number(userId));
      
      if (!player) {
        return next(new Error('Invalid user'));
      }
      
      // Store user and game information on the socket
      socket.data.userId = Number(userId);
      socket.data.username = player.username;
      socket.data.gameId = Number(gameId);
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  // Handle connections
  io.on('connection', (socket: Socket) => {
    const { gameId, userId, username } = socket.data;
    
    log(`User ${username} (ID: ${userId}) connected to game ${gameId}`);
    
    // Add player to game room
    socket.join(`game:${gameId}`);
    
    // Make sure the game exists in the game manager
    const game = gameManager.getGame(gameId);
    
    if (!game) {
      // Create the game if it doesn't exist yet
      log(`Creating new game instance for game ${gameId}`);
      gameManager.createGame(gameId);
    }
    
    // Handle pre-game lobby
    socket.on('player:ready', async (data) => {
      const { ready, customization } = data;
      
      log(`Player ${username} (ID: ${userId}) is ${ready ? 'ready' : 'not ready'}`);
      
      try {
        await gameManager.setPlayerReady(gameId, userId, ready, customization);
        
        // Check if all players are ready to start the game
        const canStart = await gameManager.canStartGame(gameId);
        
        if (canStart) {
          // Notify all players that the game can start
          const gameData = await gameManager.getGameState(gameId);
          
          io.to(`game:${gameId}`).emit('pregame:update', gameData);
        }
      } catch (err) {
        console.error('Error setting player ready status:', err);
        socket.emit('error', 'Failed to update ready status');
      }
    });
    
    socket.on('player:team', async (data) => {
      const { team } = data;
      
      log(`Player ${username} (ID: ${userId}) changed to team ${team}`);
      
      try {
        await gameManager.setPlayerTeam(gameId, userId, team);
        
        // Notify all players about the team change
        const gameData = await gameManager.getGameState(gameId);
        
        io.to(`game:${gameId}`).emit('pregame:update', gameData);
      } catch (err) {
        console.error('Error changing player team:', err);
        socket.emit('error', 'Failed to change team');
      }
    });
    
    socket.on('game:start', async () => {
      log(`Starting game ${gameId}`);
      
      try {
        const canStart = await gameManager.canStartGame(gameId);
        
        if (canStart) {
          // Start the game
          await gameManager.startGame(gameId);
          
          // Notify all players that the game is starting
          io.to(`game:${gameId}`).emit('game:starting');
          
          // Send initial game state to all players
          const gameState = await gameManager.getGameState(gameId);
          
          setTimeout(() => {
            io.to(`game:${gameId}`).emit('game:state', gameState);
          }, 1000);
        } else {
          socket.emit('error', 'Cannot start game - not all players are ready');
        }
      } catch (err) {
        console.error('Error starting game:', err);
        socket.emit('error', 'Failed to start game');
      }
    });
    
    // Handle in-game actions
    socket.on('player:action', async (action: PlayerAction) => {
      log(`Player ${username} (ID: ${userId}) action: ${action.type}`);
      
      try {
        // Process the player action
        if (action.type === 'swing') {
          // Handle swing action
          await gameManager.processSwing(gameId, userId, action.angle || 0, action.power || 0);
          
          // Update all clients with new game state
          const gameState = await gameManager.getGameState(gameId);
          io.to(`game:${gameId}`).emit('game:update_players', gameState.players);
        } else if (action.type === 'aim') {
          // Handle aiming action - just relay to other players
          socket.to(`game:${gameId}`).emit('player:aim', {
            playerId: userId,
            angle: action.angle
          });
        } else if (action.type === 'ready') {
          // Player is ready to move to next hole
          await gameManager.playerReadyForNextHole(gameId, userId);
          
          // Check if all players are ready to move to the next hole
          const allReady = await gameManager.areAllPlayersReadyForNextHole(gameId);
          
          if (allReady) {
            // Move to the next hole
            await gameManager.moveToNextHole(gameId);
            
            // Notify clients about hole completion
            io.to(`game:${gameId}`).emit('game:hole_complete');
            
            // Send updated game state
            setTimeout(async () => {
              const gameState = await gameManager.getGameState(gameId);
              io.to(`game:${gameId}`).emit('game:state', gameState);
            }, 3000);
          }
        } else if (action.type === 'chat' && action.message) {
          // Relay chat messages to all players
          io.to(`game:${gameId}`).emit('chat:message', {
            playerId: userId,
            username,
            message: action.message
          });
        }
      } catch (err) {
        console.error('Error processing player action:', err);
        socket.emit('error', 'Failed to process action');
      }
    });
    
    // Handle ball position updates
    socket.on('ball:position', (position) => {
      // Relay ball position to other players
      socket.to(`game:${gameId}`).emit('game:ball_moved', userId, position);
    });
    
    // Handle ball in hole event
    socket.on('ball:in_hole', async () => {
      log(`Player ${username} (ID: ${userId}) ball in hole`);
      
      try {
        await gameManager.playerFinishedHole(gameId, userId);
        
        // Update score
        const currentHole = await gameManager.getCurrentHole(gameId);
        const strokes = await gameManager.getPlayerStrokes(gameId, userId);
        
        // Notify all clients about score update
        io.to(`game:${gameId}`).emit('game:score_update', userId, currentHole, strokes);
        
        // Check if all players have finished the hole
        const allFinished = await gameManager.haveAllPlayersFinishedHole(gameId);
        
        if (allFinished) {
          // Notify clients about hole completion
          io.to(`game:${gameId}`).emit('game:hole_complete');
        }
      } catch (err) {
        console.error('Error processing hole completion:', err);
        socket.emit('error', 'Failed to process hole completion');
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', async () => {
      log(`User ${username} (ID: ${userId}) disconnected from game ${gameId}`);
      
      try {
        // Temporarily mark the player as disconnected
        await gameManager.playerDisconnected(gameId, userId);
        
        // If all players disconnect, the game will be cleaned up after a timeout
        setTimeout(async () => {
          const anyConnected = await gameManager.anyPlayersConnected(gameId);
          
          if (!anyConnected) {
            // Clean up the game if no players are connected
            log(`All players disconnected from game ${gameId}, cleaning up`);
            gameManager.removeGame(gameId);
          }
        }, 1000 * 60 * 5); // 5 minutes
      } catch (err) {
        console.error('Error handling player disconnect:', err);
      }
    });
  });
  
  log('Socket.io server initialized');
}
