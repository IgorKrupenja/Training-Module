import { FC } from 'react';
import { format } from 'date-fns';

import { Message } from 'types/message';
import Markdownify from "./Markdownify";

type ChatMessageProps = {
  message: Message;
  onMessageClick?: (message: Message) => void;
}

const ChatMessage: FC<ChatMessageProps> = ({ message, onMessageClick }) => {
    return (
        <div className="historical-chat__message">
            <button
                className="historical-chat__message-text"
                onClick={onMessageClick ? () => onMessageClick(message) : undefined}
            >
                <Markdownify message={message.content ?? ''} />
            </button>
            <time
                dateTime={message.authorTimestamp}
                className="historical-chat__message-date"
            >
                {format(new Date(message.authorTimestamp), 'HH:mm:ss')}
            </time>
        </div>
    );
};

export default ChatMessage;
