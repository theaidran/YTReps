# Spaced Repetition System Overview

This document provides a summary of how the spaced repetition system works in our application.

## Available Algorithms

The application offers three different spaced repetition algorithms:
1. Standard Algorithm (default)
2. SuperMemo-2 (Anki version)
3. Leitner System

## Review Process

### 1. Starting a Review
Users can choose from four review modes:
- Due Today: Cards scheduled for review today
- New Flashcards Only: Cards never reviewed before
- Hard Flashcards Only: Cards marked as difficult
- Random Selection: Random selection of cards

### 2. Number of Cards
Users can select:
- All cards
- Fixed number (10, 20)
- Custom number

### 3. Response Quality Scale
All algorithms use a 0-5 grading scale:
- 0: Complete blackout
- 1: Wrong answer
- 2: Hard to remember
- 3: Good answer with effort
- 4: Easy answer
- 5: Perfect answer

### 4. Algorithm Behavior

#### Standard Algorithm
- Uses difficulty levels with corresponding factors:
  - Easy: factor = 2.5 (fastest interval growth)
  - Medium: factor = 2.0 (standard growth)
  - Hard: factor = 1.5 (slower growth)
  - Very Hard: factor = 1.2 (slowest growth)
- Maintains a streak counter for consecutive correct answers
- Interval = factor^streak (where factor depends on difficulty)
- Wrong answers reset streak to 0

Difficulty Factors Impact:
1. Easy (2.5):
   - Fastest progression
   - streak 1: 2.5^1 = 3 days
   - streak 2: 2.5^2 = 6 days
   - streak 3: 2.5^3 = 16 days
   - streak 4: 2.5^4 = 39 days
   - streak 5: 2.5^5 = 98 days
   - Reaches 365 days at streak 7

2. Medium (2.0):
   - Standard progression
   - streak 1: 2.0^1 = 2 days
   - streak 2: 2.0^2 = 4 days
   - streak 3: 2.0^3 = 8 days
   - streak 4: 2.0^4 = 16 days
   - streak 5: 2.0^5 = 32 days
   - Reaches 365 days at streak 9

3. Hard (1.5):
   - Slower progression
   - streak 1: 1.5^1 = 2 days
   - streak 2: 1.5^2 = 3 days
   - streak 3: 1.5^3 = 4 days
   - streak 4: 1.5^4 = 5 days
   - streak 5: 1.5^5 = 8 days
   - Reaches 365 days at streak 15

4. Very Hard (1.2):
   - Slowest progression
   - streak 1: 1.2^1 = 1 day
   - streak 2: 1.2^2 = 1 day
   - streak 3: 1.2^3 = 2 days
   - streak 4: 1.2^4 = 2 days
   - streak 5: 1.2^5 = 3 days
   - Reaches 365 days at streak 32

This system ensures that:
- Easy cards quickly move to longer intervals (reaching max in 7 streaks)
- Medium cards progress at a balanced rate (reaching max in 9 streaks)
- Hard cards require more repetitions (reaching max in 15 streaks)
- Very hard cards need many correct answers (reaching max in 32 streaks)

#### SuperMemo-2 (Anki version)
- Uses Easiness Factor (EF) starting at 2.5
- First repetition: 1 day
- Second repetition: 6 days
- Subsequent: previous_interval * EF
- EF adjusts based on answer quality

EF Modification Details (Anki version):
1. EF changes after EVERY answer using the modified formula:
   EF' = EF + (0.1 - (5 - grade) * (0.1 + (5 - grade) * 0.02))

2. Grade impact on EF (4 buttons mode):
   - Grade 4 (Easy): EF increases by 0.18 (EF + 0.18)
   - Grade 3 (Good): EF increases by 0.10 (EF + 0.10)
   - Grade 2 (Hard): EF decreases by 0.02 (EF - 0.02)
   - Grade 0 (Completely forgot): EF decreases by 0.18 (EF - 0.18)

3. Grade impact on EF (6 buttons mode):
   - Grade 5 (Perfect): EF increases by 0.22 (EF + 0.22)
   - Grade 4 (Easy): EF increases by 0.18 (EF + 0.18)
   - Grade 3 (Good): EF increases by 0.10 (EF + 0.10)
   - Grade 2 (Hard): EF decreases by 0.02 (EF - 0.02)
   - Grade 1 (Wrong): EF decreases by 0.18 (EF - 0.18)
   - Grade 0 (Complete blackout): EF decreases by 0.38 (EF - 0.38)

4. Important rules:
   - EF never goes below 1.3 (minimum value)
   - Changes happen immediately after each review
   - In 4 buttons mode, grade 0 is treated as grade 1 for EF calculation
   - Quality of answer has stronger impact on EF compared to original SM-2

#### Leitner System
- Uses 5 boxes with fixed intervals
- Correct answer: Move to next box
- Wrong answer: Return to Box 1
- Fixed intervals: 1, 3, 7, 14, 30 days

## Review Flow

1. **Card Presentation**
   - Word/Phrase shown first
   - Context/Example if available
   - Media (image/audio) if available
   - Translation hidden initially

2. **User Response**
   - User reviews the card
   - Clicks "Show Translation"
   - Grades their response (0-5)

3. **Algorithm Processing**
   - Updates card properties based on selected algorithm
   - Calculates next review date
   - Updates statistics

4. **Session End**
   - Shows completion message
   - Returns to review mode selection
   - Updates statistics and charts

## Statistics and Tracking

The system tracks:
- Total number of reviews
- Success rate
- Cards mastered in last 7 days
- Distribution of cards across difficulty levels
- Algorithm-specific metrics (boxes, EF values)

## Implementation Details

### Card Properties
Each flashcard stores:
- Basic info (word, translation, context)
- Algorithm-specific data:
  - Standard: difficulty, streak
  - SuperMemo: easinessFactor, interval, repetitions
  - Leitner: box number
- Common: nextReview, lastReviewed

### Review Scheduling
- Cards are due when: current_date >= nextReview
- Maximum interval: 365 days
- Failed cards return to beginning of schedule

### Data Persistence
- All data stored in localStorage
- Exportable to file for backup
- Importable from file for restoration
