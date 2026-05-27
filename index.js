const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ChannelType,
PermissionsBitField,
ModalBuilder,
TextInputBuilder,
TextInputStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./bot.db");

// =====================
// CONFIG
// =====================
const TOKEN = process.env.TOKEN;
const ADMIN_ROLE = "ADMIN_ROLE_ID";
const EVENT_ROLE = "EVENT_ROLE_ID";

// =====================
// DATABASE
// =====================
db.run(`CREATE TABLE IF NOT EXISTS event_points (user_id TEXT PRIMARY KEY, points INTEGER DEFAULT 0)`);
db.run(`CREATE TABLE IF NOT EXISTS admin_points (user_id TEXT PRIMARY KEY, points INTEGER DEFAULT 0)`);
db.run(`CREATE TABLE IF NOT EXISTS xp (user_id TEXT PRIMARY KEY, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0)`);
db.run(`CREATE TABLE IF NOT EXISTS applications (user_id TEXT PRIMARY KEY, type TEXT)`);
// =====================
// CLIENT
// =====================
const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
});

// =====================
// SYSTEM FUNCTIONS
// =====================
function addEvent(id,a){
db.run("INSERT OR IGNORE INTO event_points VALUES (?,0)",[id]);
db.run("UPDATE event_points SET points = points + ? WHERE user_id=?",[a,id]);
}

function removeEvent(id,a){
db.run("INSERT OR IGNORE INTO event_points VALUES (?,0)",[id]);
db.run("UPDATE event_points SET points = MAX(points - ?,0) WHERE user_id=?",[a,id]);
}

function addAdmin(id,a){
db.run("INSERT OR IGNORE INTO admin_points VALUES (?,0)",[id]);
db.run("UPDATE admin_points SET points = points + ? WHERE user_id=?",[a,id]);
}

function removeAdmin(id,a){
db.run("INSERT OR IGNORE INTO admin_points VALUES (?,0)",[id]);
db.run("UPDATE admin_points SET points = MAX(points - ?,0) WHERE user_id=?",[a,id]);
}

// =====================
// PANEL
// =====================
function panel(){
return new EmbedBuilder()
.setTitle("🎛️ لوحة التحكم V7")
.setColor(0x2B2D31)
.setDescription(`
🛡️ إدارة
🎪 إيفنت
🏆 توب الإدارة
🏆 توب الإيفنت

اضغط الأزرار للتحكم
`);
}

function panelRow(){
return new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("admin").setLabel("🛡️ إدارة").setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId("event").setLabel("🎪 إيفنت").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId("top_admin").setLabel("🏆 توب إدارة").setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId("top_event").setLabel("🏆 توب إيفنت").setStyle(ButtonStyle.Primary)
);
}

// =====================
// 🎯 APPLY SYSTEM
// =====================
function applyPanel() {
return new EmbedBuilder()
.setTitle("نظام التقديم")
.setColor(0x2B2D31)
.setDescription(`
Administration:
- Name
- Age
- Experience
- Goal
- Reference

Event:
- Name
- Age
- Experience
- Design rate
- Reference

Press button to apply
`);
}

function applyRow() {
return new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("apply_admin")
.setLabel("تقديم إدارة")
.setStyle(ButtonStyle.Danger),

new ButtonBuilder()
.setCustomId("apply_event")
.setLabel("تقديم إيفنت")
.setStyle(ButtonStyle.Success)
);
}

// =====================
// MESSAGE COMMANDS
// =====================
client.on("messageCreate", async (msg)=>{

if(msg.author.bot) return;

// لوحة
if(msg.content === "!لوحة"){
return msg.channel.send({embeds:[panel()],components:[panelRow()]});
}

if (msg.content === "!تقديمات") {

  if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return;

  const embed = new EmbedBuilder()
    .setTitle("نظام التقديم")
    .setDescription(`
اختر نوع التقديم:

- إدارة السيرفر
- فريق الإيفنت

اضغط زر التقديم واملأ البيانات
`)
    .setColor(0x2B2D31);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("apply_admin")
      .setLabel("تقديم إدارة")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("apply_event")
      .setLabel("تقديم إيفنت")
      .setStyle(ButtonStyle.Success)
  );

  msg.channel.send({ embeds: [embed], components: [row] });
}

// =====================
// GIVEAWAY STORAGE
// =====================
const giveaways = {};

// =====================
// BUTTONS (ALL SYSTEMS)
// =====================
client.on("interactionCreate", async (i)=>{

if(i.isButton()){
if (i.customId === "apply_admin") {
  // نموذج تقديم الإدارة
}
  if (i.customId === "apply_admin") {

  const modal = new ModalBuilder()
    .setCustomId("admin_apply")
    .setTitle("تقديم إدارة");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("name")
        .setLabel("اسمك")
        .setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("age")
        .setLabel("عمرك")
        .setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("exp")
        .setLabel("خبراتك بالتفصيل")
        .setStyle(TextInputStyle.Paragraph)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("goal")
        .setLabel("وش طموحك في السيرفر")
        .setStyle(TextInputStyle.Paragraph)
    )
  );

  return i.showModal(modal);
  }
  if (i.customId === "apply_event") {
  // نموذج تقديم الإيفنت
  }
  if (i.customId === "apply_event") {

  const modal = new ModalBuilder()
    .setCustomId("event_apply")
    .setTitle("تقديم إيفنت");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("name")
        .setLabel("اسمك")
        .setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("age")
        .setLabel("عمرك")
        .setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("exp")
        .setLabel("خبراتك بالتفصيل")
        .setStyle(TextInputStyle.Paragraph)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("rate")
        .setLabel("تقييم تصاميمك من 10")
        .setStyle(TextInputStyle.Short)
    )
  );

  return i.showModal(modal);
  }
// ================= TICKET =================
if(["t1","t2","t3"].includes(i.customId)){
const ch = await i.guild.channels.create({
name:`ticket-${i.user.username}`,
type:ChannelType.GuildText,
permissionOverwrites:[
{id:i.guild.id,deny:[PermissionsBitField.Flags.ViewChannel]},
{id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel]},
{id:ADMIN_ROLE,allow:[PermissionsBitField.Flags.ViewChannel]}
]
});

ch.send(`<@${i.user.id}> <@&${ADMIN_ROLE}>`);
return i.reply({content:"تم فتح التكت",ephemeral:true});
}

// ================= GIVEAWAY =================
if(i.customId === "join"){
if(!giveaways[i.message.id]) giveaways[i.message.id]=[];
if(giveaways[i.message.id].includes(i.user.id))
return i.reply({content:"دخلت مسبقاً",ephemeral:true});

giveaways[i.message.id].push(i.user.id);
return i.reply({content:"تم دخولك 🎉",ephemeral:true});
client.on("interactionCreate", async (i) => {

  // ================= BUTTONS =================
  if (i.isButton()) {

    // ========= TICKET =========
    if (["t1","t2","t3"].includes(i.customId)) {

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: ADMIN_ROLE, allow: [PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      ch.send(`<@${i.user.id}> <@&${ADMIN_ROLE}>`);
      return i.reply({ content: "تم فتح التكت", ephemeral: true });
    }

    // ========= GIVEAWAY =========
    if (i.customId === "join") {
      if (!giveaways[i.message.id]) giveaways[i.message.id] = [];

      if (giveaways[i.message.id].includes(i.user.id))
        return i.reply({ content: "دخلت مسبقاً", ephemeral: true });

      giveaways[i.message.id].push(i.user.id);
      return i.reply({ content: "تم دخولك 🎉", ephemeral: true });
    }

    // ========= ACCEPT / REJECT ADMIN =========
    if (i.customId.startsWith("accept_admin_")) {
      return i.reply({ content: "تم قبول التقديم الإداري", ephemeral: true });
    }

    if (i.customId.startsWith("reject_admin_")) {
      return i.reply({ content: "تم رفض التقديم الإداري", ephemeral: true });
    }

    // ========= ACCEPT / REJECT EVENT =========
    if (i.customId.startsWith("accept_event_")) {
      return i.reply({ content: "تم قبول تقديم الإيفنت", ephemeral: true });
    }

    if (i.customId.startsWith("reject_event_")) {
      return i.reply({ content: "تم رفض تقديم الإيفنت", ephemeral: true });
    }

    // ========= PANEL =========
    if (i.customId === "admin") {

      const modal = new ModalBuilder()
        .setCustomId("admin_modal")
        .setTitle("إدارة");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("user").setLabel("ID").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("amount").setLabel("Amount").setStyle(TextInputStyle.Short)
        )
      );

      return i.showModal(modal);
    }

    if (i.customId === "event") {

      const modal = new ModalBuilder()
        .setCustomId("event_modal")
        .setTitle("إيفنت");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("user").setLabel("ID").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("amount").setLabel("Amount").setStyle(TextInputStyle.Short)
        )
      );

      return i.showModal(modal);
    }

    // ========= OPEN APPLICATION FORMS =========
    if (i.customId === "apply_admin") {

      const modal = new ModalBuilder()
        .setCustomId("admin_apply")
        .setTitle("تقديم إدارة");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("name").setLabel("اسمك").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("age").setLabel("عمرك").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("exp").setLabel("خبراتك").setStyle(TextInputStyle.Paragraph)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("goal").setLabel("طموحك").setStyle(TextInputStyle.Paragraph)
        )
      );

      return i.showModal(modal);
    }

    if (i.customId === "apply_event") {

      const modal = new ModalBuilder()
        .setCustomId("event_apply_form")
        .setTitle("تقديم إيفنت");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("name").setLabel("اسمك").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("age").setLabel("عمرك").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("exp").setLabel("خبراتك").setStyle(TextInputStyle.Paragraph)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("design").setLabel("تقييمك /10").setStyle(TextInputStyle.Short)
        )
      );

      return i.showModal(modal);
    }

    // ========= TOP =========
    if (i.customId === "top_admin") {
      db.all("SELECT * FROM admin_points ORDER BY points DESC LIMIT 10", [], (e, r) => {
        i.reply(r.map((x, i) => `${i+1}. <@${x.user_id}> - ${x.points}`).join("\n"));
      });
    }

    if (i.customId === "top_event") {
      db.all("SELECT * FROM event_points ORDER BY points DESC LIMIT 10", [], (e, r) => {
        i.reply(r.map((x, i) => `${i+1}. <@${x.user_id}> - ${x.points}`).join("\n"));
      });
    }
  }

  // ================= MODALS =================
  if (i.isModalSubmit()) {

    const APPLY_CHANNEL_ID = "PUT_CHANNEL_ID_HERE";

    // ========= ADMIN APPLY =========
    if (i.customId === "admin_apply") {

      const embed = new EmbedBuilder()
        .setTitle("New Admin Application")
        .setColor(0x2B2D31)
        .addFields(
          { name: "Name", value: i.fields.getTextInputValue("name") },
          { name: "Age", value: i.fields.getTextInputValue("age") },
          { name: "Experience", value: i.fields.getTextInputValue("exp") },
          { name: "Goal", value: i.fields.getTextInputValue("goal") },
          { name: "Applicant", value: `<@${i.user.id}>` }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_admin_${i.user.id}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`reject_admin_${i.user.id}`)
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger)
      );

      const ch = await client.channels.fetch(APPLY_CHANNEL_ID);
      await ch.send({ embeds: [embed], components: [row] });

      return i.reply({ content: "تم إرسال التقديم", ephemeral: true });
    }

    // ========= EVENT APPLY =========
    if (i.customId === "event_apply_form") {

      const embed = new EmbedBuilder()
        .setTitle("New Event Application")
        .setColor(0x57F287)
        .addFields(
          { name: "Name", value: i.fields.getTextInputValue("name") },
          { name: "Age", value: i.fields.getTextInputValue("age") },
          { name: "Experience", value: i.fields.getTextInputValue("exp") },
          { name: "Design", value: i.fields.getTextInputValue("design") },
          { name: "Applicant", value: `<@${i.user.id}>` }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_event_${i.user.id}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`reject_event_${i.user.id}`)
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger)
      );

      const ch = await client.channels.fetch(APPLY_CHANNEL_ID);
      await ch.send({ embeds: [embed], components: [row] });

      return i.reply({ content: "تم إرسال التقديم", ephemeral: true });
    }
  }
});
// =====================
// LOGIN
// =====================
client.login(TOKEN);
