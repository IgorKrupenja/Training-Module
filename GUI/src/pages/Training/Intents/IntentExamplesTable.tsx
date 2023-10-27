import { FC, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createColumnHelper } from '@tanstack/react-table';
import { useMutation } from '@tanstack/react-query';
import { AxiosError, HttpStatusCode } from 'axios';
import {
  MdDeleteOutline,
  MdOutlineModeEditOutline,
  MdOutlineSave,
  MdAddCircle,
} from 'react-icons/md';

import { Button, DataTable, Dialog, FormTextarea, Icon } from 'components';
import useDocumentEscapeListener from 'hooks/useDocumentEscapeListener';
import { INTENT_EXAMPLE_LENGTH } from 'constants/config';
import type { Entity } from 'types/entity';
import { turnExampleIntoIntent, deleteExample, editExample } from 'services/intents';
import { useToast } from 'hooks/useToast';
import IntentExamplesEntry from './IntentExamplesEntry';
import { Intent } from '../../../types/intent';

type IntentExamplesTableProps = {
  examples: string[];
  onAddNewExample: (example: string) => void;
  entities: Entity[];
  selectedIntent: Intent;
};

const IntentExamplesTable: FC<IntentExamplesTableProps> = ({
  examples,
  onAddNewExample,
  entities,
  selectedIntent,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const newExampleRef = useRef<HTMLTextAreaElement>(null);
  const [exampleText, setExampleText] = useState<string>('');
  const [editableRow, setEditableRow] = useState<{
    intentName: string;
    value: string;
  } | null>(null);
  const [deletableRow, setDeletableRow] = useState<{
    intentName: string;
    value: string;
  } | null>(
    null
  );
  const [exampleToIntent, setExampleToIntent] = useState<{
    intentName: string,
    value: string;
  } | null>(null);
  const columnHelper = createColumnHelper<{ id: string; value: string }>();

  useDocumentEscapeListener(() => setEditableRow(null));

  const examplesData = useMemo(
    () => examples.map((selectedIntent, e) => ({ id: selectedIntent, value: e })),
    [examples]
  );

  const handleEditableRow = (example: { intentName: string; value: string }) => {
    setEditableRow(example);
  };

  const exampleToIntentMutation = useMutation({
    mutationFn: ({ exampleName }: {intentName: string, exampleName: string} ) =>
      turnExampleIntoIntent({
        intentName: selectedIntent.intent,
        exampleName: exampleName,
      }),
    onSuccess: () => {
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'Example converted to the intent',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message:
          error.response?.status === HttpStatusCode.Conflict
            ? t('training.intents.error.turnExampleIntoIntent')
            : error.message,
      });
    },
    onSettled: () => setExampleToIntent(null),
  });

  const exampleEditMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { example: string };
    }) => editExample(id, data),
    onSuccess: () => {
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'New example added',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
    onSettled: () => setEditableRow(null),
  });

  const exampleDeleteMutation = useMutation({
    mutationFn: ({ intentName, example }: { intentName: string, example: string }) =>
        deleteExample(intentName, example),
    onSuccess: () => {
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'Example deleted',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
    onSettled: () => setDeletableRow(null),
  });

  const handleNewExampleSubmit = () => {
    if (!newExampleRef.current) return;
    onAddNewExample(newExampleRef.current.value || '');
    newExampleRef.current.value = '';
    setExampleText('');
  };

  const examplesColumns = useMemo(
    () => [
      columnHelper.accessor('value', {
        header: t('training.intents.examples') || '',
        cell: (props) =>
          editableRow && editableRow.intentName === props.row.original.id ? (
            <FormTextarea
              name={`example-${props.row.original.id}`}
              label=""
              defaultValue={editableRow.value}
              hideLabel
              minRows={1}
              maxLength={INTENT_EXAMPLE_LENGTH}
              showMaxLength
            />
          ) : (
            <IntentExamplesEntry value={props.getValue()} entities={entities} />
          ),
      }),
      columnHelper.display({
        header: '',
        cell: ({
          row: {
            original: { id, value: name },
          },
        }) => (
          <Button
            appearance="text"
            onClick={() => setExampleToIntent({ intentName: id, value: name} )}
          >
            <Icon
              label={t('training.intents.turnExampleIntoIntent')}
              icon={<MdOutlineModeEditOutline color={'rgba(0,0,0,0.54)'} />}
            />
            {t('training.intents.turnExampleIntoIntent')}
          </Button>
        ),
        id: 'turnExampleIntoIntent',
        meta: {
          size: '1%',
        },
      }),
      columnHelper.display({
        header: '',
        cell: (props) => (
          <>
            {editableRow && editableRow.intentName === props.row.original.id ? (
              <Button
                appearance="text"
                onClick={() =>
                  exampleEditMutation.mutate({
                    id: props.row.original.id,
                    data: { example: props.row.original.value },
                  })
                }
              >
                <Icon
                  label={t('global.save')}
                  icon={<MdOutlineSave color={'rgba(0,0,0,0.54)'} />}
                />
                {t('global.save')}
              </Button>
            ) : (
              <Button
                appearance="text"
                onClick={() => handleEditableRow({ intentName: props.row.original.id, value: props.row.original.value})}
              >
                <Icon
                  label={t('global.edit')}
                  icon={<MdOutlineModeEditOutline color={'rgba(0,0,0,0.54)'} />}
                />
                {t('global.edit')}
              </Button>
            )}
          </>
        ),
        id: 'edit',
        meta: {
          size: '1%',
        },
      }),
      columnHelper.display({
        header: '',
        cell: (props) => (
          <Button
            appearance="text"
            onClick={() => setDeletableRow({ intentName: props.row.original.id, value: props.row.original.value })}
          >
            <Icon
              label={t('global.delete')}
              icon={<MdDeleteOutline color={'rgba(0,0,0,0.54)'} />}
            />
            {t('global.delete')}
          </Button>
        ),
        id: 'delete',
        meta: {
          size: '1%',
        },
      }),
    ],
    [columnHelper, t, editableRow, entities, exampleEditMutation]
  );

  return (
    <>
      <DataTable
        data={examplesData}
        columns={examplesColumns}
        tableBodyPrefix={
          <tr>
            <td>
              <FormTextarea
                ref={newExampleRef}
                label={t('global.addNew')}
                name="newExample"
                minRows={1}
                placeholder={t('global.addNew') + '...' || ''}
                hideLabel
                maxLength={INTENT_EXAMPLE_LENGTH}
                showMaxLength
                onChange={(e) => setExampleText(e.target.value)}
              />
            </td>
            <td>
              <Button
                appearance="text"
                onClick={handleNewExampleSubmit}
                disabled={exampleText.length === 0}
              >
                <Icon icon={<MdAddCircle color={'rgba(0,0,0,0.54)'} />} />
                {t('global.add')}
              </Button>
            </td>
            <td></td>
          </tr>
        }
      />

      {/* TODO: Refactor dialog content */}
      {deletableRow !== null && (
        <Dialog
          title={t('training.intents.deleteExample')}
          onClose={() => setDeletableRow(null)}
          footer={
            <>
              <Button
                appearance="secondary"
                onClick={() => setDeletableRow(null)}
              >
                {t('global.no')}
              </Button>
              <Button
                appearance="error"
                onClick={() =>
                  exampleDeleteMutation.mutate({ intentName: deletableRow.intentName, example: deletableRow.value })
                }
              >
                {t('global.yes')}
              </Button>
            </>
          }
        >
          <p>{t('global.removeValidation')}</p>
        </Dialog>
      )}

      {exampleToIntent !== null && (
        <Dialog
          title={t('training.intents.turnExampleIntoIntent')}
          onClose={() => setExampleToIntent(null)}
          footer={
            <>
              <Button
                appearance="secondary"
                onClick={() => setExampleToIntent(null)}
              >
                {t('global.no')}
              </Button>
              <Button
                appearance="error"
                onClick={() => {
                    exampleToIntentMutation.mutate({
                      intentName: exampleToIntent.intentName,
                      exampleName: exampleToIntent.value
                    })
                  }
                }
              >
                {t('global.yes')}
              </Button>
            </>
          }
        >
          <p>{t('global.removeValidation')}</p>
        </Dialog>
      )}
    </>
  );
};

export default IntentExamplesTable;
