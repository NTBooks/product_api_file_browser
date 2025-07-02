import { useEffect, useState } from 'react';
import { useEvents } from '../contexts/EventContext';

export const usePendingUpload = (fileHash) => {
    const { events, isConnected } = useEvents();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [confirmationTime, setConfirmationTime] = useState(null);

    useEffect(() => {
        if (!fileHash || !isConnected) return;

        // Check if we already have a confirmation event for this file
        const confirmationEvent = events.find(event =>
            event.type === 'file.uploaded' &&
            event.data &&
            event.data.hash === fileHash
        );

        if (confirmationEvent) {
            setIsConfirmed(true);
            setConfirmationTime(confirmationEvent.timestamp);
        } else {
            setIsConfirmed(false);
            setConfirmationTime(null);
        }
    }, [fileHash, events, isConnected]);

    return {
        isConfirmed,
        confirmationTime,
        isConnected
    };
}; 