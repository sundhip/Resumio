import { EventEmitter } from 'events';

export interface PresenceUser {
  userId: string;
  name: string;
  role: string;
  avatar?: string;
  lastActiveAt: string;
}

export interface CandidatePresence {
  candidateId: string;
  activeRecruiters: PresenceUser[];
}

export interface PlatformEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

/**
 * Enterprise In-Memory Real-Time Event Bus & Collaboration Hub.
 * Manages Server-Sent Events (SSE) broadcasting, recruiter presence,
 * and live candidate profile viewing collision detection.
 */
class RealtimeEventBus extends EventEmitter {
  // candidateId -> Map<userId, PresenceUser>
  private activeViewers: Map<string, Map<string, PresenceUser>> = new Map();
  private userKeepAlives: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    // Allow high connection fan-out
    this.setMaxListeners(200);
  }

  /**
   * Broadcast an event to all connected clients
   */
  public broadcast<T = any>(type: string, payload: T) {
    const event: PlatformEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.emit('broadcast', event);
  }

  /**
   * Register or renew recruiter presence viewing a specific candidate
   */
  public touchPresence(candidateId: string, user: { userId: string; name: string; role: string; avatar?: string }): CandidatePresence {
    if (!this.activeViewers.has(candidateId)) {
      this.activeViewers.set(candidateId, new Map());
    }

    const viewers = this.activeViewers.get(candidateId)!;
    const now = new Date().toISOString();

    const presenceUser: PresenceUser = {
      userId: user.userId,
      name: user.name || 'Anonymous Recruiter',
      role: user.role || 'recruiter',
      avatar: user.avatar,
      lastActiveAt: now,
    };

    viewers.set(user.userId, presenceUser);

    // Auto-expire presence after 45 seconds of silence
    const timerKey = `${candidateId}:${user.userId}`;
    if (this.userKeepAlives.has(timerKey)) {
      clearTimeout(this.userKeepAlives.get(timerKey)!);
    }

    const timeout = setTimeout(() => {
      this.leavePresence(candidateId, user.userId);
    }, 45000);
    this.userKeepAlives.set(timerKey, timeout);

    const presenceState = this.getPresence(candidateId);
    this.broadcast('presence:update', presenceState);
    return presenceState;
  }

  /**
   * Explicitly remove presence when user closes candidate profile modal or navigates away
   */
  public leavePresence(candidateId: string, userId: string): CandidatePresence {
    const timerKey = `${candidateId}:${userId}`;
    if (this.userKeepAlives.has(timerKey)) {
      clearTimeout(this.userKeepAlives.get(timerKey)!);
      this.userKeepAlives.delete(timerKey);
    }

    const viewers = this.activeViewers.get(candidateId);
    if (viewers) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        this.activeViewers.delete(candidateId);
      }
    }

    const presenceState = this.getPresence(candidateId);
    this.broadcast('presence:update', presenceState);
    return presenceState;
  }

  /**
   * Get active viewers on a candidate profile
   */
  public getPresence(candidateId: string): CandidatePresence {
    const viewers = this.activeViewers.get(candidateId);
    const activeRecruiters = viewers ? Array.from(viewers.values()) : [];
    return {
      candidateId,
      activeRecruiters,
    };
  }

  /**
   * Clean up all presence for test suites or resets
   */
  public clearAll() {
    this.userKeepAlives.forEach((timer) => clearTimeout(timer));
    this.userKeepAlives.clear();
    this.activeViewers.clear();
  }
}

export const realtimeEventBus = new RealtimeEventBus();
