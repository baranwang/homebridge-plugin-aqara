import { useRequest } from 'ahooks';
import { FormInstance } from 'rc-field-form';
import { useEffect } from 'react';

export const usePluginConfig = (form?: FormInstance) => {
  const { data: pluginConfigs } = useRequest(() => window.homebridge.getPluginConfig());

  useEffect(() => {
    if (pluginConfigs?.length && form) {
      form.setFieldsValue(pluginConfigs[0]);
    }
  }, [pluginConfigs]);

  return { pluginConfigs };
};
