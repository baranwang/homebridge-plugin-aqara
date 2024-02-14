import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';
import { AqaraApi, AqaraApiOption } from "@api/index";

class UiServer extends HomebridgePluginUiServer {
    constructor() {
        super()

        this.onRequest('/device', this.getAuthCode.bind(this));

        this.ready();
    }

    getAuthCode(config: AqaraApiOption) {
        const aqaraApi = new AqaraApi(config);
        return aqaraApi.getAuthCode();
    }
}

(() => {
    return new UiServer();
})();