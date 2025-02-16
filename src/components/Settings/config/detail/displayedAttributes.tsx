import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { DisplayedAttributes as TDisplayedAttributes } from 'meilisearch';
import { FC, useEffect, useMemo } from 'react';
import { IndexSettingConfigComponentProps } from '../..';
import { ArrayInput } from './arrayInput';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export const DisplayedAttributes: FC<IndexSettingConfigComponentProps> = ({
  client,
  className,
  host,
  toggleLoading,
}) => {
  const { t } = useTranslation('instance');

  const query = useQuery({
    queryKey: ['getDisplayedAttributes', host, client.uid],
    async queryFn(ctx) {
      return await client.getDisplayedAttributes();
    },
  });

  const mutation = useMutation({
    mutationKey: ['updateDisplayedAttributes', host, client.uid],
    async mutationFn(variables: TDisplayedAttributes) {
      console.debug('🚀 ~ file: displayedAttributes.tsx:19 ~ mutationFn ~ variables:', variables);
      if (_.isEmpty(variables)) {
        // empty to reset
        return await client.resetDisplayedAttributes();
      }
      return await client.updateDisplayedAttributes(variables);
    },
  });

  useEffect(() => {
    const isLoading = query.isLoading || query.isFetching || mutation.isLoading;
    toggleLoading(isLoading);
  }, [mutation.isLoading, query.isFetching, query.isLoading, toggleLoading]);

  return useMemo(
    () => (
      <div className={clsx(className)}>
        <h2 className="font-semibold">Displayed Attributes</h2>
        <span className="text-sm flex gap-2">
          <p>{t('setting.index.config.displayedAttributes.description')}</p>
          <a
            className="link info text-info-800"
            href="https://docs.meilisearch.com/learn/configuration/displayed_searchable_attributes.html#displayed-fields"
            target={'_blank'}
            rel="noreferrer"
          >
            {t('learn_more')}
          </a>
        </span>
        <ArrayInput
          className="py-2"
          defaultValue={query.data || []}
          onMutation={(value) => {
            mutation.mutate(value);
          }}
        />
      </div>
    ),
    [className, mutation, query.data, t]
  );
};
