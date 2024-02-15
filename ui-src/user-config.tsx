import { Button, Form, InputGroup } from 'react-bootstrap';
import { FormField } from './components/form-field';
import RcForm from 'rc-field-form';
import { usePluginConfig } from './hooks/use-plugin-config';
import { useContext, useState } from 'react';
import { ConfigContext } from './context';
import { hbRequest } from './utils';

export interface AppConfigProps {
  onNext?: () => void;
}

export const UserConfig: React.FC<AppConfigProps> = ({ onNext }) => {
  const [form] = RcForm.useForm();
  usePluginConfig(form);

  const { config, setConfig } = useContext(ConfigContext);

  const handleGetAuthCode = () => {
    form
      .validateFields(['account'])
      .then((values) => {
        const { account } = values;
        const params = {
          ...config,
          account,
        };
        setConfig(() => params);
        window.homebridge.updatePluginConfig([params]);
        hbRequest('/auth-code', params);
      })
      .catch((err) => {
        window.homebridge.toast.error(err.errorFields[0].errors[0]);
      });
  };

  const handleGetToken = () => {
    form
      .validateFields()
      .then((values) => {
        const params = {
          ...config,
          ...values,
        };
        hbRequest('/token', params).then(() => {
          onNext?.();
        });
      })
      .catch((err) => {
        window.homebridge.toast.error(err.errorFields[0].errors[0]);
      });
  };
  return (
    <RcForm form={form}>
      <FormField name='account' label='Email or Phone Number' rules={[{ required: true }]}>
        <Form.Control type='text' placeholder='Enter Aqara account' />
      </FormField>

      <Form.Group className='mb-3'>
        <Form.Label>Auth Code</Form.Label>
        <InputGroup>
          <RcForm.Field name='authCode' rules={[{ required: true }]}>
            <Form.Control type='text' placeholder='Enter code' required />
          </RcForm.Field>
          <Button variant='elegant' onClick={handleGetAuthCode}>
            Get Code
          </Button>
        </InputGroup>
      </Form.Group>

      <Button variant='primary' onClick={handleGetToken}>
        Get Token
      </Button>
    </RcForm>
  );
};
