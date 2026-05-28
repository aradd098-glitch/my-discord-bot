// ======================
// V14 DISCORD BOT
// ======================

const sqlite3 = require("sqlite3").verbose();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

// ======================
// CONFIG
// ======================

const TOKEN = "PUT_TOKEN_HERE";

const ADMIN_ROLE = "ADMIN_ROLE_ID";
const APPLICATION_CHANNEL = "APPLICATION_CHANNEL_ID";
const LOG_CHANNEL = "LOG_CHANNEL_ID";
const TICKET_CATEGORY = "TICKET_CATEGORY_ID";

// ======================
// CLIENT
// ======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ======================
// DATABASE
// ======================

const db = new sqlite3.Database("./bot.db");

db.run(`
CREATE TABLE IF NOT EXISTS applications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT,
type TEXT,
status TEXT,
reason TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS admin_points (
user_id TEXT PRIMARY KEY,
points INTEGER DEFAULT 0
)
`);

// ======================
// MEMORY
// ======================

const activeApps = new Set();
const giveaways = {};

// ======================
// READY
// ======================

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ======================
// EMBEDS
// ======================

function mainPanel() {
  return new EmbedBuilder()
    .setTitle("CONTROL PANEL V14")
    .setDescription("Main Control Panel")
    .setColor(0x2B2D31);
}

function mainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("panel_apply")
      .setLabel("Applications")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("panel_ticket")
      .setLabel("Tickets")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("panel_giveaway")
      .setLabel("Giveaway")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("panel_admin")
      .setLabel("Admin")
      .setStyle(ButtonStyle.Danger)
  );
}

// ======================
// MESSAGE COMMANDS
// ======================

client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  // ======================
  // PANEL
  // ======================

  if (msg.content === "!panel") {
    msg.channel.send({
      embeds: [mainPanel()],
      components: [mainButtons()]
    });
  }

  // ======================
  // GIVEAWAY
  // ======================

  if (msg.content.startsWith("!giveaway")) {

    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const args = msg.content.split(" ");

    const prize = args.slice(1).join(" ");

    if (!prize) return msg.reply("حدد الجائزة");

    const embed = new EmbedBuilder()
      .setTitle("GIVEAWAY")
      .setDescription(`Prize: ${prize}`)
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_giveaway")
        .setLabel("Join")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("end_giveaway")
        .setLabel("End")
        .setStyle(ButtonStyle.Danger)
    );

    const giveawayMsg = await msg.channel.send({
      embeds: [embed],
      components: [row]
    });

    giveaways[giveawayMsg.id] = [];
  }

  // ======================
  // ADMIN POINTS
  // ======================

  if (msg.content.startsWith("!addpoints")) {

    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const member = msg.mentions.members.first();

    const amount = parseInt(msg.content.split(" ")[2]);

    if (!member || isNaN(amount)) return;

    db.run(`
    INSERT INTO admin_points(user_id, points)
    VALUES(?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET points = points + ?
    `, [member.id, amount, amount]);

    msg.reply(`Added ${amount} points to ${member.user.tag}`);
  }

  if (msg.content.startsWith("!points")) {

    const member = msg.mentions.members.first() || msg.member;

    db.get(`
    SELECT * FROM admin_points WHERE user_id = ?
    `, [member.id], (err, row) => {

      let points = 0;

      if (row) points = row.points;

      msg.reply(`${member.user.tag} has ${points} points`);
    });
  }

});

// ======================
// INTERACTIONS
// ======================

client.on("interactionCreate", async (i) => {

  // ======================
  // BUTTONS
  // ======================

  if (i.isButton()) {

    // ======================
    // APPLICATION PANEL
    // ======================

    if (i.customId === "panel_apply") {

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("apply_admin")
          .setLabel("Admin Apply")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("apply_event")
          .setLabel("Event Apply")
          .setStyle(ButtonStyle.Success)
      );

      return i.reply({
        content: "Choose Application",
        components: [row],
        ephemeral: true
      });
    }

    // ======================
    // TICKET PANEL
    // ======================

    if (i.customId === "panel_ticket") {

      const channel = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY,
        permissionOverwrites: [
          {
            id: i.guild.id,
            deny: ["ViewChannel"]
          },
          {
            id: i.user.id,
            allow: ["ViewChannel", "SendMessages"]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle("Ticket Opened")
        .setDescription("Support will assist you soon.")
        .setColor(0x2B2D31);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `${i.user}`,
        embeds: [embed],
        components: [row]
      });

      return i.reply({
        content: `Ticket created: ${channel}`,
        ephemeral: true
      });
    }

    // ======================
    // CLOSE TICKET
    // ======================

    if (i.customId === "close_ticket") {

      await i.reply({
        content: "Closing ticket...",
        ephemeral: true
      });

      setTimeout(() => {
        i.channel.delete().catch(() => {});
      }, 3000);
    }

    // ======================
    // GIVEAWAY JOIN
    // ======================

    if (i.customId === "join_giveaway") {

      if (!giveaways[i.message.id]) giveaways[i.message.id] = [];

      if (giveaways[i.message.id].includes(i.user.id)) {
        return i.reply({
          content: "Already joined",
          ephemeral: true
        });
      }

      giveaways[i.message.id].push(i.user.id);

      return i.reply({
        content: "Joined giveaway",
        ephemeral: true
      });
    }

    // ======================
    // GIVEAWAY END
    // ======================

    if (i.customId === "end_giveaway") {

      const users = giveaways[i.message.id];

      if (!users || users.length === 0) {
        return i.reply({
          content: "No participants",
          ephemeral: true
        });
      }

      const winner =
        users[Math.floor(Math.random() * users.length)];

      i.channel.send(`Winner: <@${winner}>`);

      const logChannel = await client.channels.fetch(LOG_CHANNEL);

      if (logChannel) {
        logChannel.send(`Giveaway Winner: <@${winner}>`);
      }

      return i.reply({
        content: "Giveaway ended",
        ephemeral: true
      });
    }

    // ======================
    // APPLY ADMIN
    // ======================

    if (i.customId === "apply_admin") {

      if (activeApps.has(i.user.id)) {
        return i.reply({
          content: "عندك تقديم مفتوح",
          ephemeral: true
        });
      }

      activeApps.add(i.user.id);

      const modal = new ModalBuilder()
        .setCustomId("admin_application")
        .setTitle("Admin Application");

      modal.addComponents(

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Name")
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("age")
            .setLabel("Age")
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("experience")
            .setLabel("Experience")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return i.showModal(modal);
    }

    // ======================
    // APPLY EVENT
    // ======================

    if (i.customId === "apply_event") {

      if (activeApps.has(i.user.id)) {
        return i.reply({
          content: "عندك تقديم مفتوح",
          ephemeral: true
        });
      }

      activeApps.add(i.user.id);

      const modal = new ModalBuilder()
        .setCustomId("event_application")
        .setTitle("Event Application");

      modal.addComponents(

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Name")
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("age")
            .setLabel("Age")
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("experience")
            .setLabel("Experience")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return i.showModal(modal);
    }

    // ======================
    // ACCEPT / REJECT
    // ======================

    if (
      i.customId.startsWith("accept_") ||
      i.customId.startsWith("reject_")
    ) {

      if (
        !i.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return i.reply({
          content: "No Permission",
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`reason_${i.customId}`)
        .setTitle("Reason");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Reason")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return i.showModal(modal);
    }

  }

  // ======================
  // MODALS
  // ======================

  if (i.isModalSubmit()) {

    // ======================
    // APPLICATION SUBMIT
    // ======================

    if (
      i.customId === "admin_application" ||
      i.customId === "event_application"
    ) {

      const type =
        i.customId === "admin_application"
          ? "ADMIN"
          : "EVENT";

      const embed = new EmbedBuilder()
        .setTitle(`${type} APPLICATION`)
        .setColor(0x2B2D31)
        .addFields(
          {
            name: "Name",
            value: i.fields.getTextInputValue("name")
          },
          {
            name: "Age",
            value: i.fields.getTextInputValue("age")
          },
          {
            name: "Experience",
            value: i.fields.getTextInputValue("experience")
          },
          {
            name: "User",
            value: `<@${i.user.id}>`
          }
        );

      db.run(`
      INSERT INTO applications(user_id, type, status, reason)
      VALUES(?, ?, ?, ?)
      `, [
        i.user.id,
        type,
        "PENDING",
        ""
      ]);

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(`accept_${type}_${i.user.id}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`reject_${type}_${i.user.id}`)
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger)
      );

      const appChannel =
        await client.channels.fetch(APPLICATION_CHANNEL);

      if (appChannel) {
        appChannel.send({
          embeds: [embed],
          components: [row]
        });
      }

      const logChannel =
        await client.channels.fetch(LOG_CHANNEL);

      if (logChannel) {
        logChannel.send(
          `New ${type} application from ${i.user.tag}`
        );
      }

      activeApps.delete(i.user.id);

      return i.reply({
        content: "Application Sent",
        ephemeral: true
      });
    }

    // ======================
    // ACCEPT / REJECT REASON
    // ======================

    if (i.customId.startsWith("reason_")) {

      const data = i.customId.replace("reason_", "");

      const parts = data.split("_");

      const action = parts[0];
      const type = parts[1];
      const userId = parts[2];

      const reason =
        i.fields.getTextInputValue("reason");

      const status =
        action === "accept"
          ? "ACCEPTED"
          : "REJECTED";

      db.run(`
      UPDATE applications
      SET status = ?, reason = ?
      WHERE user_id = ?
      `, [
        status,
        reason,
        userId
      ]);

      const user = await client.users.fetch(userId);

      if (user) {

        const embed = new EmbedBuilder()
          .setTitle(`APPLICATION ${status}`)
          .setDescription(reason)
          .setColor(
            status === "ACCEPTED"
              ? 0x57F287
              : 0xED4245
          );

        user.send({
          embeds: [embed]
        }).catch(() => {});
      }

      const logChannel =
        await client.channels.fetch(LOG_CHANNEL);

      if (logChannel) {
        logChannel.send(
          `${status} | ${userId} | ${reason}`
        );
      }

      return i.reply({
        content: `${status} Successfully`,
        ephemeral: true
      });
    }

  }

});

// ======================
// LOGIN
// ======================

client.login(TOKEN);
