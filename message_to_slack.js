const env = PropertiesService.getScriptProperties()
const BOT_TOKEN = env.getProperty("token");
Logger.log(BOT_TOKEN);

// API URL của Slack
const SLACK_API_URL = 'https://slack.com/api';

// Các cột trong spreadsheet
const COLUMNS = {
CRON: 0,      // Cột A
CHANNEL: 1,   // Cột B
USERS: 2,     // Cột C
CONTENT: 3,   // Cột D
ACTIVE: 4,    // Cột E
TIMESTAMP: 5, // Cột F
};

// Function to process notifications from the spreadsheet
function main() {
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MessageSchedule');;
const lastRow = sheet.getLastRow();

for (let row = 2; row <= lastRow; row++) {
  const rowData = sheet.getRange(row, 1, 1, 6).getValues()[0];
  const cronPattern = rowData[COLUMNS.CRON];
  const channel = rowData[COLUMNS.CHANNEL];
  const users = rowData[COLUMNS.USERS];
  const content = rowData[COLUMNS.CONTENT];
  const isActive = rowData[COLUMNS.ACTIVE] == 1;

  if (!isActive) {
    Logger.log(`Skipping inactive notification at row ${row}`);
    continue;
  }

  if (isCronMatchNow(cronPattern)) {
    Logger.log(`Processing notification at row ${row}`);
    const messageSent = sendSlackMessage(channel, users, content);

    if (messageSent) {
      sheet.getRange(row, COLUMNS.TIMESTAMP + 1).setValue(new Date());
    }
  } else {
     Logger.log(`checkCronMatch failed ${cronPattern}`);
  }
}
}

/**
* Hàm kiểm tra thời gian hiện tại có khớp với biểu thức cron
* @param {string} cron - Biểu thức cron
* @returns {boolean} - Trả về true nếu khớp, false nếu không
*/
function isCronMatchNow(cron) {
// Phân tích biểu thức cron
const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.split(' ');

// Lấy thời gian hiện tại
const now = new Date();
const currentMinute = now.getMinutes();
const currentHour = now.getHours();
const currentDay = now.getDate();
const currentMonth = now.getMonth() + 1; // Tháng bắt đầu từ 0 nên cần +1
const currentDayOfWeek = now.getDay();

// Hàm kiểm tra từng trường của biểu thức cron
const matchField = (field, value) => {
  if (field === '*') return true;
  if (field.includes('/')) {
    const [base, step] = field.split('/').map(Number);
    return value % step === 0;
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }
  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value);
  }
  return Number(field) === value;
};

// Kiểm tra từng trường
return (
  matchField(minute, currentMinute) &&
  matchField(hour, currentHour) &&
  matchField(dayOfMonth, currentDay) &&
  matchField(month, currentMonth) &&
  matchField(dayOfWeek, currentDayOfWeek)
);
}

function getUserIds(usernames) {
const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SlackUserID');
if (!userSheet) {
  Logger.log('SlackUserID sheet not found.');
  return [];
}

const userData = userSheet.getDataRange().getValues();
const userMap = userData.reduce((map, row) => {
  const username = row[0]?.trim(); // Column A: Username
  const userId = row[1]?.trim();  // Column B: User ID
  if (username && userId) {
    map[username] = userId;
  }
  return map;
}, {});

return usernames
  .map(username => userMap[username.trim()] || username.trim())
  .filter(userId => userId); // Keep only valid IDs
}

// Function to send a message to Slack
function sendSlackMessage(channel, users, content) {
const usernames = users.split(',').map(user => user.trim());
const userIds = getUserIds(usernames);
const mentions = userIds.map(userId => `${userId}`).join(' ');

const messagePayload = {
  channel: channel,
  text: `${mentions}\n${content}`,
  link_names: true,
};

const requestOptions = {
  method: 'post',
  headers: {
    'Authorization': `Bearer ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  payload: JSON.stringify(messagePayload),
};

try {
  const response = UrlFetchApp.fetch(`${SLACK_API_URL}/chat.postMessage`, requestOptions);
  const responseData = JSON.parse(response.getContentText());

  if (responseData.ok) {
    Logger.log(`Message sent successfully to channel: ${channel}`);
    return true;
  } else {
    Logger.log(`Slack API error: ${responseData.error}`);
    return false;
  }
} catch (error) {
  Logger.log(`Error sending message to Slack: ${error.message}`);
  return false;
}
}
