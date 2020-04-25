/* eslint-disable no-console */
const Discord = require("discord.js");
const { compose, curry } = require("ramda");
require("dotenv").config();

const client = new Discord.Client();

const botCommands = [];
botCommands.push({
  regex: /hey/,
  fn: (message) => message.reply("sup"),
});

botCommands.push({
  regex: /sup/,
  response: "HEY HO MOFO",
});

const isNotUser = curry((user, message) =>
  message && message.author !== user ? message : false
);

// Prevent bot from responding to its own messages
const isNotSelf = isNotUser(client.user);

// only respond to DMs in 'dev' mode
const isNotInDevMode = (message) =>
  message && process.argv.includes("--dev") && message.channel.type !== "dm"
    ? false
    : message;

// does not respond to users with the specified role
const doesNotHaveRole = curry((ROLE_ID, message) => {
  return message &&
    message.author &&
    message.author.lastMessage &&
    message.author.lastMessage.member &&
    message.author.lastMessage.member.roles &&
    message.author.lastMessage.member.roles.has(ROLE_ID)
    ? false
    : message;
});

const NOBOT_ROLE_ID = "513916941212188698";
const isNotNobot = doesNotHaveRole(NOBOT_ROLE_ID);

const filterCommands = curry((commandArray, message) =>
  message ? commandArray.filter((c) => message.content.match(c.regex)) : false
);

const getMatchingCommands = filterCommands(botCommands);

const filterMessage = compose(isNotNobot, isNotInDevMode, isNotSelf);

const processMessage = compose(getMatchingCommands, filterMessage);

const respondToMessages = (message) => {
  const matches = processMessage(message);

  if (!matches) return;

  matches.forEach((command) => {
    if (command.fn) {
      command.fn(message);
    }
    if (command.response) {
      message.channel.send(command.response);
    }
  });
};

const listenToMessages = () => {
  client.on("message", respondToMessages);
};

const app = () => {
  let listening = false;
  client.on("ready", () => {
    if (!listening) {
      listenToMessages();
      listening = true;
    }
  });

  client.login(process.env.DISCORD_API_KEY);
};

app();
