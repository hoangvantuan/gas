## Setup Requirements

1. **Google Sheets Setup**
   Create a Google Spreadsheet with two sheets:

   - `MessageSchedule` - For message scheduling
   - `SlackUserID` - For username to Slack ID mapping

2. **Slack Bot Token**
   ```javascript
   // Add in Script Properties
   token = "xoxb-your-bot-token";
   ```

## Sheet Configuration Examples

### MessageSchedule Sheet

| A (Cron)        | B (Channel) | C (Users)   | D (Content)            | E (Active) | F (Timestamp) |
| --------------- | ----------- | ----------- | ---------------------- | ---------- | ------------- |
| _/30 _ \* \* \* | #general    | user1,user2 | Daily standup reminder | 1          | [auto-filled] |
| 0 9 \* \* 1-5   | #team       | user3       | Weekly report due      | 1          | [auto-filled] |

### SlackUserID Sheet

| A (Username) | B (User ID) |
| ------------ | ----------- |
| user1        | U01ABC123DE |
| user2        | U02DEF456GH |

## Cron Examples with Explanations

```text
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-6) (Sunday=0)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Common patterns:

```text
*/30 * * * *    Every 30 minutes
0 9 * * 1-5     9:00 AM on weekdays
0 */2 * * *     Every 2 hours
30 9 * * *      9:30 AM daily
```

## Function Usage

The script contains three main functions:

1. `main()` - Main scheduler function that processes the spreadsheet
2. `isCronMatchNow(cron)` - Validates if current time matches cron pattern
3. `sendSlackMessage(channel, users, content)` - Sends message to Slack

## Trigger Setup

1. Open Script Editor
2. Go to Triggers (clock icon)
3. Add new trigger:
   - Choose function to run: `main`
   - Select event source: Time-driven
   - Select type: Minutes timer
   - Select interval: Every minute

This will check the schedule every minute and send messages according to the cron patterns.
