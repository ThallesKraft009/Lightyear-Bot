const WebSocket = require('websocket').w3cwebsocket;
const fs = require("fs");
const colors = require("colors")

module.exports = class Bot {
  constructor({ token, intents }) {
    this.token = token;
    this.intents = intents;
    this.payload = {
      op: 2,
      d: {
        token: token,
        intents: intents,
        properties: {
          $os: 'linux',
          $browser: 'chrome',
          $device: 'chrome',
        },
      },
    };

    const gatewayURL = 'wss://gateway.discord.gg/?v=9&encoding=json';
    this.gatewayURL = gatewayURL;
    this.ws = null;
    this.heartbeatInterval = null;
  }

  start() {
    this.ws = new WebSocket(this.gatewayURL);

    this.ws.onopen = () => {
      this.identify();
      console.log(colors.yellow("WebSocket aberto."))
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 10) {
        const { heartbeat_interval } = data.d;
        this.heartbeatInterval = setInterval(this.sendHeartbeat.bind(this), heartbeat_interval);
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
      } else if (data.op === 11) {
        console.log('Heartbeat ACK received.');
      }
      
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error.message);
      this.reconnect();
    };

    this.ws.onclose = () => {
      this.reconnect();
    };
  }

  identify() {
    this.ws.send(JSON.stringify(this.payload));
  }

  sendHeartbeat() {
    this.ws.send(JSON.stringify({ op: 1, d: null }));
  }

  reconnect() {
    clearInterval(this.heartbeatInterval);
    this.ws.close();

    this.reconnectAttempts++;
    const reconnectIntervalIncrement = Math.random() * 1000;
    const maxReconnectInterval = 60000;
    this.reconnectInterval = Math.min(
      this.reconnectInterval * 2 + reconnectIntervalIncrement,
      maxReconnectInterval
    );

    setTimeout(() => {
      this.start();
    }, this.reconnectInterval);
  }

  setStatus({ status: a, game: x }) {
    const statusPayload = {
      op: 3,
      d: {
        since: null,
        game: x,
        status: `${a}`,
        afk: false,
      },
    };
    setTimeout(() => {
    this.ws.send(JSON.stringify(statusPayload));
  }, 5000)
  }

  async PrefixLoad({prefix: prefix, local: local}){

    const commands = [];

    fs.readdirSync(`./${local}/`).forEach(dir => {
        const files = fs.readdirSync(`./${local}/${dir}/`).filter(file => file.endsWith('.js'));

        files.forEach((file) => {
            let command = require(`../${local}/${dir}/${file}`)

            if(command) {
           commands[command.name] = command;
            } 
        })
    })
    
      this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.op === 0) {
      const { t, d } = data;
      if (t === 'MESSAGE_CREATE') {
        
        if(d.channel.type !== 0) return;
          
	if(!d.content.startsWith(prefix)) return; 
	const args = d.content.slice(prefix.length).trim().split(/ +/g); 
	const cmd = args.shift().toLowerCase();
	if(cmd.length == 0 ) return;
	let command = commands[cmd]

  command.run(d, args);
        
      } else if(t === "READY") {
        console.log(colors.green("Client Conectado."))
      }}}
  }
};
    