import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Player customization
export const playerCustomizations = pgTable("player_customizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ballType: integer("ball_type").notNull().default(0),
  clubType: integer("club_type").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerCustomizationSchema = createInsertSchema(playerCustomizations).pick({
  userId: true,
  ballType: true,
  clubType: true,
});

// Game session schema
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  mode: text("mode").notNull(), // solo, 2player, 3player, 4player, 2v2
  courseStyle: integer("course_style").notNull().default(0),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  hostId: true,
  name: true,
  mode: true,
  courseStyle: true,
});

// Game players schema
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => gameSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  team: integer("team").notNull().default(0),
  score: jsonb("score").notNull().default({}),
  ready: boolean("ready").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).pick({
  gameId: true,
  userId: true,
  team: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PlayerCustomization = typeof playerCustomizations.$inferSelect;
export type InsertPlayerCustomization = z.infer<typeof insertPlayerCustomizationSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type GamePlayer = typeof gamePlayers.$inferSelect;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;

// Enums and other types for the application
export type GameMode = "solo" | "2player" | "3player" | "4player" | "2v2";
export type GameStatus = "waiting" | "playing" | "finished";

// Socket message types
export interface GameState {
  id: number;
  players: {
    id: number;
    username: string;
    team: number;
    score: Record<string, number>;
    customization: {
      ballType: number;
      clubType: number;
    };
    position?: [number, number, number];
    isCurrentTurn: boolean;
  }[];
  currentHole: number;
  status: GameStatus;
  mode: GameMode;
  courseStyle: number;
}

export interface PlayerAction {
  type: 'swing' | 'aim' | 'ready' | 'chat';
  angle?: number;
  power?: number;
  message?: string;
}
