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
    data: accessToken,
    refresh,
    cancel,
  } = useRequest(() => window.homebridge.request('/token/local', config), {
    pollingInterval: 1000 * 2,
    ready: !!config.account,
    refreshDeps: [config.account],
    onSuccess: (data) => {
      if (data) {
        cancel();
      }
    },
  });

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      <div hidden={step !== 0 || !!accessToken}>
        <AppConfig onNext={() => setStep(1)} />
      </div>
      <div hidden={step !== 1 || !!accessToken}>
        <UserConfig onNext={() => refresh()} />
      </div>

      {!!accessToken && (
        <Form.Group className='mb-3'>
          <Form.Label>Access Token</Form.Label>
          <Form.Control type='text' value={accessToken} />
        </Form.Group>
      )}
    </ConfigContext.Provider>
  );
};
