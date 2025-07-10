import {CellContext, createColumnHelper, PaginationState, SortingState} from '@tanstack/react-table';
import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {MdOutlineRemoveRedEye} from 'react-icons/md';
import {BACKOFFICE_NAME, Chat} from '../../types/chat';
import {formatDate} from '../../util/charts-utils';
import Button from '../Button';
import Card from '../Card';
import DataTable from '../DataTable';
import Icon from '../Icon';
import Track from '../Track';
import Drawer from "../Drawer";
import HistoricalChat from "../HistoricalChat";
import './ChatsTable.scss';
import {useMutation} from "@tanstack/react-query";
import {analyticsApi} from "../services/api";
import {AxiosError} from "axios";
import {ChatHistory} from '@buerokratt-ria/common-gui-components';
import {useToast} from "../../hooks/useToast";
import useStore from "../../store/user/store";

type Props = {
    dataSource: Chat[];
    startDate?: string;
    endDate?: string;
    pagination?: PaginationState;
    sorting?: SortingState;
    setSorting?: (state: SortingState) => void;
    setPagination?: (state: PaginationState) => void;
};

const ChatsTable = (props: Props) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const toast = useToast();
    const userInfo = useStore((state) => state.userInfo);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    type CombinedRow = Chat & { firstName?: string; lastName?: string };
    const columnHelper = createColumnHelper<CombinedRow>();
    const {t} = useTranslation();

    useEffect(() => {
        const fetchChats = async () => {
            setChats(props.dataSource);
        };
        fetchChats().catch(console.error);
    }, [props.dataSource]);

    const dateTimeFormat = (props: CellContext<Chat, string>) =>
        formatDate(new Date(props.getValue()), 'd. MMM yyyy HH:mm:ss');

    const feedbackViewButton = (dataTableProps: any) => (
        <Button
            onClick={() => {
                getChatById.mutate(dataTableProps.row.original.baseId ?? '');
            }}
            appearance="text">
            <Track>
                <Icon icon={<MdOutlineRemoveRedEye color={'rgba(0,0,0,0.54)'}/>}/>
                {t('feedback.view')}
            </Track>
        </Button>
    );

    const getChatById = useMutation({
        mutationFn: (chatId: string) =>
            analyticsApi.post('chats/get', {
                chatId: chatId,
            }),
        onSuccess: (res: any) => {
            setSelectedChat(res.data.response);
        },
    });

    const handleCommentChange = (comment: string) => {
        if (!selectedChat) return;
        const displayName = userInfo?.displayName || "";
        chatCommentChangeMutation.mutate({chatId: selectedChat.id,comment: comment, authorDisplayName: displayName});
    };

    const chatCommentChangeMutation = useMutation({
        mutationFn: (data: { chatId: string | number; comment: string ; authorDisplayName: string;}) =>
            analyticsApi.post('feedbacks/add-comment', data),
        onSuccess: (res, {chatId, comment}) => {
            const updatedChatList = chats.map((chat) =>
                chat.id === chatId ? {...chat, comment} : chat
            );
            setChats(updatedChatList);
            if (selectedChat) setSelectedChat({...selectedChat, comment});
            toast.open({
                type: 'success',
                title: t('global.notification'),
                message: t('toast.success.chatCommentChanged'),
            });
        },
        onError: (error: AxiosError) => {
            toast.open({
                type: 'error',
                title: t('global.notificationError'),
                message: error.message,
            });
        },
    });

    const chatColumns = useMemo(
        () => [
            columnHelper.accessor('baseId', {
                header: 'ID',
            }),
            columnHelper.accessor(
                (row) => {
                    if (Array.isArray(row.allCsaNames) && !(row.allCsaNames.length === 1 && (row.allCsaNames[0] == null || row.allCsaNames[0].toString().trim() === ''))) {
                        const cleanedNames = row.allCsaNames
                            .filter(name => !!name && typeof name === 'string')
                            .map(name => name.trim())
                            .filter(name => name !== "")
                            .filter((name, index, self) => self.indexOf(name) === index);

                        const filteredNames = cleanedNames.length > 1
                            ? cleanedNames.filter(name => name !== "Bürokratt")
                            : cleanedNames;

                        return filteredNames.join(", ");
                    } else {
                        return BACKOFFICE_NAME.DEFAULT;
                    }
                },
                {
                    id: `name`,
                    header: t('chat.history.csaName') ?? '',
                }
            ),
            columnHelper.accessor('feedbackText', {
                header: t('feedback.feedback') ?? '',
            }),
            columnHelper.accessor('comment', {
                header: t('feedback.comment') ?? '',
            }),
            columnHelper.accessor('created', {
                header: t('feedback.startTime') ?? '',
                cell: dateTimeFormat,
            }),
            columnHelper.accessor('ended', {
                header: t('feedback.endTime') ?? '',
                cell: dateTimeFormat,
            }),
            columnHelper.accessor('rating', {
                header: t('chart.rating') ?? '',
            }),
            columnHelper.display({
                id: 'detail',
                cell: feedbackViewButton,
                meta: {
                    size: '3%',
                    sticky: 'right'
                },
            }),
        ],
        []
    );

    return (
        <>
            <ChatHistory
                toastContext={useToast()}
                displayDateFilter={false}
                displaySearchBar={false}
                displayTitle={false}
                delegatedEndDate={props.endDate}
                delegatedStartDate={props.startDate}
                user={useStore.getState().userInfo}
            />
            TEST
            <div className="card-drawer-container">

        <div className="card-drawer-container">
            <div className="card-wrapper">
                <Card isScrollable={true}>
                    <DataTable
                        data={chats}
                        columns={chatColumns}
                        selectedRow={(row) => row.original.baseId === selectedChat?.id}
                        pagination={props.pagination}
                        sorting={props.sorting}
                        sortable={true}
                        setSorting={props.setSorting}
                        setPagination={props.setPagination}
                    />
                </Card>
            </div>
            {selectedChat && (
                <div className="drawer-container">
                    <Drawer
                        title={
                            selectedChat.endUserFirstName !== '' && selectedChat.endUserLastName !== ''
                                ? `${selectedChat.endUserFirstName} ${selectedChat.endUserLastName}`
                                : t('global.anonymous')
                        }
                        onClose={() => setSelectedChat(null)}
                    >
                        <HistoricalChat
                            header_link={selectedChat.endUserUrl}
                            chat={selectedChat}
                            onCommentChange={handleCommentChange}
                            trigger={true}

                            />
                        </Drawer>
                    </div>
                )}
            </div>
            </div>
        </>
    );
};

export default ChatsTable;
