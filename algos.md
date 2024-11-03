# SPACED REPETITION ALGORITHMS

This document explains the three spaced repetition algorithms implemented in the application: Standard Algorithm, SuperMemo-2, and Leitner System.

## 1. STANDARD ALGORITHM

Uses difficulty levels and streak-based intervals.

Instead of a simple calculation of days as interval = 2^streak, it uses factor^streak depending on the difficulty level.

### Difficulty Levels and Factors:
- Easy: factor = 2.5
- Medium: factor = 2.0
- Hard: factor = 1.5
- Very Hard: factor = 1.2

### Interval Calculation:
- interval = factor^streak
- Maximum interval: 365 days

### Examples:
**Medium difficulty (factor = 2.0):**
- streak 1: 2^1 = 2 days
- streak 2: 2^2 = 4 days
- streak 3: 2^3 = 8 days
- streak 4: 2^4 = 16 days
- streak 5: 2^5 = 32 days

**Very Hard (factor = 1.2):**
- streak 1: 1.2^1 = 1 day
- streak 2: 1.2^2 = 1 day
- streak 3: 1.2^3 = 2 days
- streak 4: 1.2^4 = 2 days
- streak 5: 1.2^5 = 3 days
- streak 10: 1.2^10 = 6 days
- streak 15: 1.2^15 = 15 days

### Response Grading:
- 0-2: Reset streak to 0, set difficulty to "very hard"
- 3: Keep streak, set difficulty to "medium"
- 4-5: Increase streak, set difficulty to "easy"

## STREAK EXPLANATION

Streak is a counter of consecutive correct answers. It's a key component in calculating review intervals:

### 1. How streak works:
- Starts at 0 for new flashcards
- Increases by 1 for each correct answer (grade ≥ 3)
- Resets to 0 for wrong answers (grade < 3)

### 2. Streak impact on intervals (examples):
**Medium difficulty (factor = 2.0):**
- streak 0: first review
- streak 1: 2^1 = 2 days (after first correct answer)
- streak 2: 2^2 = 4 days (after second correct answer)
- streak 3: 2^3 = 8 days (after third correct answer)
- streak 4: 2^4 = 16 days (after fourth correct answer)

**Very Hard (factor = 1.2):**
- streak 0: first review
- streak 1: 1.2^1 = 1 day
- streak 2: 1.2^2 = 1 day
- streak 3: 1.2^3 = 2 days
- streak 4: 1.2^4 = 2 days

### 3. Streak and Difficulty Interaction:
- Higher difficulty (lower factor) = slower interval growth
- Lower difficulty (higher factor) = faster interval growth
- Wrong answer = reset streak and shorter intervals
- Consistent correct answers = longer intervals

### 4. Example Scenario:
Starting with medium difficulty (factor = 2.0):
- Day 1: First review → correct → streak 1 → next in 2 days
- Day 3: Second review → correct → streak 2 → next in 4 days
- Day 7: Third review → wrong → streak 0 → next in 1 day
- Day 8: Fourth review → correct → streak 1 → next in 2 days
- ...and so on

### 5. Benefits of Streak System:
- Rewards consistent correct answers
- Quickly identifies difficult cards
- Adapts intervals based on performance
- Provides motivation for correct answers

## 2. SUPERMEMO-2 ALGORITHM

Uses dynamic Easiness Factor (EF) and repetition-based intervals.

### Initial Values:
- EF (Easiness Factor) = 2.5
- Interval = 1 day
- Repetitions = 0

### Interval Calculation:
1. First repetition: 1 day
2. Second repetition: 6 days
3. Subsequent repetitions: interval = previous_interval * EF

### EF Modification Formula (Anki version):
- EF' = EF + (0.1 - (5 - grade) * (0.1 + (5 - grade) * 0.02))
- Minimum EF = 1.3

### Grade impact on EF (4 buttons mode):
- Grade 4 (Easy): EF increases by 0.18 (EF + 0.18)
- Grade 3 (Good): EF increases by 0.10 (EF + 0.10)
- Grade 2 (Hard): EF decreases by 0.02 (EF - 0.02)
- Grade 0 (Completely forgot): EF decreases by 0.18 (EF - 0.18)

### Grade impact on EF (6 buttons mode):
- Grade 5 (Perfect): EF increases by 0.22 (EF + 0.22)
- Grade 4 (Easy): EF increases by 0.18 (EF + 0.18)
- Grade 3 (Good): EF increases by 0.10 (EF + 0.10)
- Grade 2 (Hard): EF decreases by 0.02 (EF - 0.02)
- Grade 1 (Wrong): EF decreases by 0.18 (EF - 0.18)
- Grade 0 (Complete blackout): EF decreases by 0.38 (EF - 0.38)

### Examples:
**For EF = 2.5:**
1. Day 1: First review
2. Day 7: Second review (6 days)
3. Day 22: Third review (6 * 2.5 = 15 days)
4. Day 77: Fourth review (22 * 2.5 = 55 days)

**For EF = 1.3 (minimum):**
1. Day 1: First review
2. Day 7: Second review (6 days)
3. Day 15: Third review (6 * 1.3 = 8 days)
4. Day 25: Fourth review (8 * 1.3 = 10 days)

### Important rules:
- EF never goes below 1.3 (minimum value)
- Changes happen immediately after each review
- In 4 buttons mode, grade 0 is treated as grade 1 for EF calculation
- Quality of answer has stronger impact on EF compared to original SM-2

## 3. LEITNER SYSTEM

Uses fixed intervals based on box numbers.

### Boxes and Intervals:
- Box 1: Review every day
- Box 2: Review every 3 days
- Box 3: Review every 7 days
- Box 4: Review every 14 days
- Box 5: Review every 30 days

### Rules:
1. New cards start in Box 1
2. Correct answer: Move to next box
3. Wrong answer: Return to Box 1

### Example Journey:
1. Start in Box 1 (daily review)
2. Correct → Box 2 (review in 3 days)
3. Correct → Box 3 (review in 7 days)
4. Wrong → Back to Box 1 (daily review)
5. Correct → Box 2 (review in 3 days)

## RESPONSE QUALITY SCALE

All algorithms use a 0-5 grading scale:
- 0: Complete blackout ("Completely forgot")
- 1: Wrong answer ("Wrong")
- 2: Hard to remember ("Hard")
- 3: Good answer with effort ("Good")
- 4: Easy answer ("Easy")
- 5: Perfect answer ("Perfect")

Grades 3 and above are considered successful recalls.
Grades 0-2 are considered failures.

## ALGORITHM COMPARISON

### Standard Algorithm:
**Advantages:**
- Adapts to individual card difficulty
- Quick progression for easy cards
- Flexible difficulty adjustment

**Disadvantages:**
- May progress too quickly
- Less scientific basis than SuperMemo

### SuperMemo-2:
**Advantages:**
- More scientific approach
- Better long-term retention
- Dynamic difficulty adjustment

**Disadvantages:**
- More complex
- Slower initial progression
- May be overwhelming for casual users

### Leitner System:
**Advantages:**
- Simple to understand
- Fixed, predictable intervals
- Easy to visualize progress

**Disadvantages:**
- Less adaptive
- Binary feedback only
- Fixed intervals may not suit all users

## IMPLEMENTATION DETAILS

### Flashcard Properties:
- Standard: difficulty, streak, nextReview
- SuperMemo: easinessFactor, interval, repetitions, nextReview
- Leitner: leitnerBox, nextReview

### Review Scheduling:
All algorithms use nextReview property to determine when a card should be reviewed:
`new Date(flashcard.nextReview) <= now`

### Maximum Intervals:
All algorithms have a maximum interval of 365 days.