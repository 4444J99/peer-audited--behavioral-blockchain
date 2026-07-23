# Failure Notification & Stake Settlement Copy Framework

## 1. Executive Summary & Clinical Intent
When a behavioral contract reaches a non-completion state (contract failure), emotional safety and dignity are paramount. In Recovery streams (e.g. No-Contact, Habit Cessation), shame framing or punitive language triggers relapse and abandonment.

Styx enforces **Clinical Detachment and Encouraging Re-Engagement Framing** across all notification channels (Web, Mobile Push, Email, SSE Tavern Feed).

## 2. Core Messaging Principles
1. **No Shaming Language**: Use "Your commitment period has concluded" or "Goal period ended" instead of "You failed" or "Breached".
2. **No Sunk-Cost Framing**: Use "Stake settled per contract terms" instead of "You lost $X".
3. **Immediate Re-Engagement Path**: Highlight the **Phoenix Recovery Badge** ("Complete your next contract to earn the Phoenix Recovery badge") and cool-off period framing ("Rest and reset before your next commitment").

## 3. Surface Copy Specifications

### 3.1 Web & Mobile Notifications
- **Title**: `Commitment Period Concluded`
- **Body**: `Your 30-day No-Contact contract has completed its active period. Every step forward counts. Take time to reset, and claim your Phoenix Recovery badge on your next goal.`

### 3.2 Email Notifications (Universal-Mail Integration)
- **Subject**: `Styx Update: Commitment Period Concluded`
- **Header**: `Your Journey Continues`
- **Body**: `Your behavioral contract has concluded. Your stake of $30 has been settled in accordance with FBO escrow rules. Remember: growth is non-linear. You are eligible to initiate a new commitment once your 7-day reset period completes.`

### 3.3 Tavern SSE Feed (Public Observer View)
- **Event**: `CONTRACT_CONCLUDED`
- **Public Message**: `An anonymous participant completed a commitment period. Honor the effort.`

## 4. Verification & Testing
- Unit tested in `@styx/shared/libs/behavioral-logic.ts`.
- Content moderation & crisis detection integration verified in `crisis-detection.service.ts`.
