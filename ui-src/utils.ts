export const hbRequest = (path: string, body?: any) => {
  window.homebridge.showSpinner();
  return window.homebridge.request(path, body).finally(() => {
    window.homebridge.hideSpinner();
  });
};
