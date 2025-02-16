import './baseInfo.css';
import { FC, useCallback, useMemo, useState } from 'react';
import { ActionIcon, Button, Modal, Text, TextInput, Tooltip } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { hiddenRequestLoader, showRequestLoader } from '@/src/utils/loader';
import { getTimeText, showTaskSubmitNotification } from '@/src/utils/text';
import { IndexObject, IndexOptions } from 'meilisearch';
import { IconPencilMinus } from '@tabler/icons-react';
import { matches, useForm } from '@mantine/form';
import { IndexSettingComponentProps } from '.';
import { useTranslation } from 'react-i18next';

export const BaseInfo: FC<IndexSettingComponentProps> = ({ host, client }) => {
  const { t } = useTranslation('instance');

  const [isRawInfoEditing, setIsRawInfoEditing] = useState<boolean>(false);

  const onClickEditPrimaryKey = useCallback(() => {
    setIsRawInfoEditing(true);
  }, []);

  const queryRawInfo = useQuery(
    ['rawInfo', host, client.uid],
    async () => {
      showRequestLoader();
      return await client.getRawInfo();
    },
    {
      keepPreviousData: true,
      onSuccess: () => {
        // change display data when not editing
        !isRawInfoEditing && resetRawInfo();
      },
      onSettled: () => {
        hiddenRequestLoader();
      },
    }
  );
  const [indexRawInfoDisplayData, setIndexRawInfoDisplayData] = useState<IndexObject>();

  const resetRawInfo = useCallback(() => {
    setIsRawInfoEditing(false);
    setIndexRawInfoDisplayData(queryRawInfo.data);
  }, [queryRawInfo.data]);

  const rawInfoMutation = useMutation(
    ['rawInfo', host, client.uid],
    async (variables: IndexOptions) => {
      showRequestLoader();
      return await client.update(variables);
    },
    {
      onSuccess: (t) => {
        showTaskSubmitNotification(t);
        setTimeout(() => queryRawInfo.refetch(), 450);
      },
      onSettled: () => {
        hiddenRequestLoader();
      },
    }
  );

  const editRawInfoForm = useForm({
    initialValues: {
      primaryKey: indexRawInfoDisplayData?.primaryKey,
    },
    validate: {
      primaryKey: matches(/[a-zA-Z\d-_]+/, t('setting.index.edit.form.primaryKey.validation_error')),
    },
  });

  const onSubmitEditRawInfoUpdate = useCallback(
    async (values: typeof editRawInfoForm.values) => {
      setIsRawInfoEditing(false);
      values && rawInfoMutation.mutate(values);
    },
    [editRawInfoForm, rawInfoMutation]
  );

  return useMemo(
    () => (
      <div className="has-border bg-bw-50 py-2 px-3 rounded-lg">
        <p className={`text-xl font-bold font-sans`}>{t('setting.index.index_info')}</p>
        <div className={`index-properties grid grid-cols-6 gap-2`}>
          <p className={`cell`}>UID</p>
          <p className={`cell`}>{indexRawInfoDisplayData?.uid}</p>
          <p className={`cell`}>{t('primaryKey')}</p>
          <div className={`cell flex items-center gap-x-1`}>
            {indexRawInfoDisplayData?.primaryKey || '-'}
            <ActionIcon variant="transparent" onClick={onClickEditPrimaryKey}>
              <IconPencilMinus size={18} />
            </ActionIcon>
          </div>
          <p className={`cell`}>{t('created_at')}</p>
          <p className={`cell`}>{getTimeText(indexRawInfoDisplayData?.createdAt)}</p>
          <p className={`cell`}>{t('updated_at')}</p>
          <p className={`cell`}>{getTimeText(indexRawInfoDisplayData?.updatedAt)}</p>
        </div>
        <Modal
          opened={isRawInfoEditing}
          onClose={() => setIsRawInfoEditing(false)}
          centered
          lockScroll
          radius="lg"
          shadow="xl"
          padding="xl"
          withCloseButton={true}
          title={<p className={`font-bold text-lg`}>{t('edit') + t('primaryKey')}</p>}
        >
          <form
            className={`flex flex-col gap-y-6 w-full `}
            onSubmit={editRawInfoForm.onSubmit(onSubmitEditRawInfoUpdate)}
          >
            <Tooltip position={'bottom-start'} label={t('setting.index.edit.form.primaryKey.tip')}>
              <TextInput
                autoFocus
                radius="md"
                size={'lg'}
                placeholder={t('setting.index.edit.form.primaryKey.placeholder')}
                {...editRawInfoForm.getInputProps('primaryKey')}
              />
            </Tooltip>
            <Button
              type="submit"
              radius={'xl'}
              size={'lg'}
              variant="light"
              // submit only value changed
              disabled={editRawInfoForm.values.primaryKey === indexRawInfoDisplayData?.primaryKey}
            >
              {t('submit')}
            </Button>
            <div>
              <Text
                variant="link"
                component="a"
                color="gray"
                size="sm"
                href="//docs.meilisearch.com/learn/core_concepts/primary_key.html#primary-key"
              >
                {t('setting.index.edit.form.primaryKey.learn_more')}
              </Text>
            </div>
          </form>
        </Modal>
      </div>
    ),
    [
      editRawInfoForm,
      t,
      indexRawInfoDisplayData?.createdAt,
      indexRawInfoDisplayData?.primaryKey,
      indexRawInfoDisplayData?.uid,
      indexRawInfoDisplayData?.updatedAt,
      isRawInfoEditing,
      onClickEditPrimaryKey,
      onSubmitEditRawInfoUpdate,
    ]
  );
};
