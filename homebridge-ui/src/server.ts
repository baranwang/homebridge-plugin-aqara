import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';

class UiServer extends HomebridgePluginUiServer {
    constructor() {
        super()
    }
}

(() => {
    return new UiServer();
})();