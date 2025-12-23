import { useRef, useState, useEffect, useCallback } from 'react';
import { AUTO_ROTATION } from '../utils/constants';

interface UseAutoRotationResult {
    isRotating: boolean;
    velocity: number;
    stop: () => void;
    start: () => void;
    onInteractionStart: () => void;
    onInteractionEnd: () => void;
    updateVelocity: (delta: number) => number;
}
export const useAutoRotation = (
    initialDelay: number = AUTO_ROTATION.INITIAL_DELAY,
    inactivityTimeout: number = AUTO_ROTATION.INACTIVITY_TIMEOUT
): UseAutoRotationResult => {
    const [isRotating, setIsRotating] = useState(false);
    const velocityRef = useRef(0);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // İlk başlatma
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRotating(true);
        }, initialDelay);

        return () => clearTimeout(timer);
    }, [initialDelay]);

    const stop = useCallback(() => {
        setIsRotating(false);
        velocityRef.current = 0;
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        setIsRotating(true);
    }, []);

    const restartTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            setIsRotating(true);
        }, inactivityTimeout);
    }, [inactivityTimeout]);

    const onInteractionStart = useCallback(() => {
        setIsRotating(false);
        velocityRef.current = 0;
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const onInteractionEnd = useCallback(() => {
        restartTimer();
    }, [restartTimer]);

    const updateVelocity = useCallback((delta: number): number => {
        const { TARGET_SPEED, ACCELERATION, MIN_VELOCITY } = AUTO_ROTATION;

        const targetVel = isRotating ? TARGET_SPEED : 0;
        velocityRef.current += (targetVel - velocityRef.current) * ACCELERATION * delta;

        // Çok düşük değerleri sıfırla
        if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
            velocityRef.current = 0;
        }

        return velocityRef.current;
    }, [isRotating]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, []);

    return {
        isRotating,
        velocity: velocityRef.current,
        stop,
        start,
        onInteractionStart,
        onInteractionEnd,
        updateVelocity,
    };
};
