import { useRequest } from 'ahooks';
import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { AppConfig } from './app-config';
import { ConfigContext } from './context';
import { UserConfig } from './user-config';

export default () => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<any>({});

  const {
    data: token,
    refresh,
    cancel,
  } = useRequest(
    async () => {
      const tokenInfo = await window.homebridge.request('/token/local', { account: config.account });
      if (tokenInfo && tokenInfo.expiresAt > Date.now()) {
        return tokenInfo;
      }
      return null;
    },
    {
      pollingInterval: 1000 * 2,
      ready: !!config.account,
      refreshDeps: [config.account],
      onSuccess: (data) => {
        if (data) {
          cancel();
        }
      },
    }
  );

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      <div hidden={step !== 0 || !!token}>
        <AppConfig onNext={() => setStep(1)} />
      </div>
      <div hidden={step !== 1 || !!token}>
        <UserConfig onNext={() => refresh()} />
      </div>

      {!!token && (
        <Form.Group className='mb-3'>
          <Form.Label>Access Token</Form.Label>
          <Form.Control type='text' value={token.accessToken} />
        </Form.Group>
      )}
    </ConfigContext.Provider>
  );
};
