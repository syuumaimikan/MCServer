import dgram from 'dgram';
import http from 'http';
import os from 'os';

/**
 * Universal Plug and Play (UPnP) IGD Port Forwarding Client
 */
class UPnPManager {
  constructor() {
    this.controlUrl = null;
    this.serviceType = null;
    this.lastOpenedPort = null;
    this.isMapped = false;
    this.routerName = 'Unknown Router';
  }

  /**
   * Discovers UPnP IGD gateway router via SSDP (UDP 239.255.255.250:1900)
   */
  async discoverGateway(timeoutMs = 3000) {
    if (this.controlUrl && this.serviceType) {
      return { controlUrl: this.controlUrl, serviceType: this.serviceType };
    }

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      let discovered = false;

      const message = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: urn:schemas-upnp-org:device:InternetGatewayDevice:1\r\n' +
        'MAN: "ssdp:discover"\r\n' +
        'MX: 2\r\n\r\n'
      );

      const timer = setTimeout(() => {
        socket.close();
        if (!discovered) {
          // Fallback second attempt with WANIPConnection
          this.discoverWANIPConnection(timeoutMs)
            .then(resolve)
            .catch(() => reject(new Error('UPnP router discovery timed out. ルーターでUPnPが無効化されているか、未対応のルーターです。')));
        }
      }, timeoutMs);

      socket.on('message', async (msg) => {
        const text = msg.toString();
        const locationMatch = text.match(/LOCATION:\s*(http:\/\/[^\r\n]+)/i);
        if (locationMatch && !discovered) {
          discovered = true;
          clearTimeout(timer);
          socket.close();
          const locationUrl = locationMatch[1].trim();

          try {
            await this.parseDeviceDescription(locationUrl);
            resolve({ controlUrl: this.controlUrl, serviceType: this.serviceType, routerName: this.routerName });
          } catch (err) {
            reject(err);
          }
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        socket.close();
        reject(err);
      });

      socket.bind(() => {
        socket.send(message, 0, message.length, 1900, '239.255.255.250');
      });
    });
  }

  async discoverWANIPConnection(timeoutMs) {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      let discovered = false;

      const message = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: urn:schemas-upnp-org:service:WANIPConnection:1\r\n' +
        'MAN: "ssdp:discover"\r\n' +
        'MX: 2\r\n\r\n'
      );

      const timer = setTimeout(() => {
        socket.close();
        if (!discovered) reject(new Error('UPnP not found'));
      }, timeoutMs);

      socket.on('message', async (msg) => {
        const text = msg.toString();
        const locationMatch = text.match(/LOCATION:\s*(http:\/\/[^\r\n]+)/i);
        if (locationMatch && !discovered) {
          discovered = true;
          clearTimeout(timer);
          socket.close();
          const locationUrl = locationMatch[1].trim();
          try {
            await this.parseDeviceDescription(locationUrl);
            resolve({ controlUrl: this.controlUrl, serviceType: this.serviceType });
          } catch (err) {
            reject(err);
          }
        }
      });

      socket.bind(() => {
        socket.send(message, 0, message.length, 1900, '239.255.255.250');
      });
    });
  }

  /**
   * Fetches root device XML and extracts controlURL
   */
  async parseDeviceDescription(locationUrl) {
    const res = await fetch(locationUrl, { signal: AbortSignal.timeout(3000) });
    const xml = await res.text();

    // Extract router friendly name
    const nameMatch = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/i);
    if (nameMatch) this.routerName = nameMatch[1];

    // Search for WANIPConnection or WANPPPConnection service
    const serviceMatch = xml.match(/<serviceType>(urn:schemas-upnp-org:service:(WANIPConnection|WANPPPConnection):[0-9]+)<\/serviceType>[\s\S]*?<controlURL>([^<]+)<\/controlURL>/i);

    if (!serviceMatch) {
      throw new Error('Could not find WANIPConnection or WANPPPConnection service on UPnP device');
    }

    this.serviceType = serviceMatch[1];
    let controlPath = serviceMatch[3];

    const baseUrl = new URL(locationUrl);
    if (controlPath.startsWith('/')) {
      this.controlUrl = `${baseUrl.protocol}//${baseUrl.host}${controlPath}`;
    } else if (controlPath.startsWith('http')) {
      this.controlUrl = controlPath;
    } else {
      this.controlUrl = `${baseUrl.protocol}//${baseUrl.host}/${controlPath}`;
    }
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * Opens / Forwards port on router
   */
  async openPort(port = 25565, protocol = 'TCP', description = 'Minecraft Server (CraftOS)') {
    await this.discoverGateway();

    const localIP = this.getLocalIP();
    const soapBody =
      `<?xml version="1.0"?>` +
      `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">` +
      `<s:Body>` +
      `<u:AddPortMapping xmlns:u="${this.serviceType}">` +
      `<NewRemoteHost></NewRemoteHost>` +
      `<NewExternalPort>${port}</NewExternalPort>` +
      `<NewProtocol>${protocol}</NewProtocol>` +
      `<NewInternalPort>${port}</NewInternalPort>` +
      `<NewInternalClient>${localIP}</NewInternalClient>` +
      `<NewEnabled>1</NewEnabled>` +
      `<NewPortMappingDescription>${description}</NewPortMappingDescription>` +
      `<NewLeaseDuration>0</NewLeaseDuration>` +
      `</u:AddPortMapping>` +
      `</s:Body>` +
      `</s:Envelope>`;

    const res = await fetch(this.controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': `"${this.serviceType}#AddPortMapping"`
      },
      body: soapBody,
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok && res.status !== 200) {
      const errText = await res.text();
      throw new Error(`UPnP AddPortMapping failed: ${res.status} ${errText}`);
    }

    this.isMapped = true;
    this.lastOpenedPort = port;

    return {
      success: true,
      port,
      protocol,
      localIP,
      router: this.routerName,
      message: `ポート ${port} (${protocol}) をルーターで自動開放しました`
    };
  }

  /**
   * Closes / Unmaps port on router
   */
  async closePort(port = 25565, protocol = 'TCP') {
    if (!this.controlUrl) return { success: true };

    const targetPort = port || this.lastOpenedPort || 25565;

    const soapBody =
      `<?xml version="1.0"?>` +
      `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">` +
      `<s:Body>` +
      `<u:DeletePortMapping xmlns:u="${this.serviceType}">` +
      `<NewRemoteHost></NewRemoteHost>` +
      `<NewExternalPort>${targetPort}</NewExternalPort>` +
      `<NewProtocol>${protocol}</NewProtocol>` +
      `</u:DeletePortMapping>` +
      `</s:Body>` +
      `</s:Envelope>`;

    try {
      await fetch(this.controlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPAction': `"${this.serviceType}#DeletePortMapping"`
        },
        body: soapBody,
        signal: AbortSignal.timeout(3000)
      });
      this.isMapped = false;
      return { success: true, port: targetPort, message: `ポート ${targetPort} を閉鎖しました` };
    } catch (_) {
      return { success: true };
    }
  }

  getStatus() {
    return {
      isMapped: this.isMapped,
      openedPort: this.lastOpenedPort,
      routerName: this.routerName,
      controlUrlAvailable: !!this.controlUrl
    };
  }
}

export const upnpManager = new UPnPManager();
