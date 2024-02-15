import RcForm from 'rc-field-form';
import { Button, Form } from 'react-bootstrap';
import { FormField } from './components/form-field';
import { usePluginConfig } from './hooks/use-plugin-config';
import { useContext } from 'react';
import { ConfigContext } from './context';

export interface AppConfigProps {
  onNext?: () => void;
}

export const AppConfig: React.FC<AppConfigProps> = ({ onNext }) => {
  const [form] = RcForm.useForm();
  const { pluginConfigs } = usePluginConfig(form);

  const { setConfig } = useContext(ConfigContext);

  const handleUpdatePluginConfig = (values: any) => {
    const configs = pluginConfigs ? [...pluginConfigs] : [];
    if (configs.length) {
      configs[0] = { ...configs[0], ...values };
    } else {
      configs.push(values);
    }
    setConfig(() => configs[0]);
    window.homebridge.updatePluginConfig(configs);
  }

  const handleValidateAppConfig = () => {
    form
      .validateFields()
      .then((res) => {
        handleUpdatePluginConfig(res);
        onNext?.();
      })
      .catch((err) => {
        window.homebridge.toast.error(err.errorFields[0].errors[0]);
      });
  };

  const handleValuesChange = (_: any, allValues: any) => {
    handleUpdatePluginConfig(allValues);
  };

  return (
    <RcForm form={form} onValuesChange={handleValuesChange}>
      <FormField name='name' label='Name' initialValue='AqaraHomebridgePlugin' rules={[{ required: true }]}>
        <Form.Control type='text' placeholder='Enter name' required />
      </FormField>
      <FormField name='region' label='Region' initialValue='cn' rules={[{ required: true }]}>
        <Form.Select bsPrefix='form-control'>
          <option value='cn'>China</option>
          <option value='us'>United States</option>
          <option value='kr'>Korea</option>
          <option value='ru'>Russia</option>
          <option value='eu'>Europe</option>
          <option value='sg'>Singapore</option>
        </Form.Select>
      </FormField>
      <FormField name='appId' label='App ID' rules={[{ required: true }]}>
        <Form.Control type='text' placeholder='Enter app ID' required />
      </FormField>
      <FormField name='appKey' label='App Key' rules={[{ required: true }]}>
        <Form.Control type='text' placeholder='Enter app key' required />
      </FormField>
      <FormField name='keyId' label='Key ID' rules={[{ required: true }]}>
        <Form.Control type='text' placeholder='Enter key ID' required />
      </FormField>
      <Button onClick={handleValidateAppConfig}>Next</Button>
    </RcForm>
  );
};
