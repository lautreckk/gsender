import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Mic, Square, Play, Pause, Download, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

interface AudioRecorderProps {
  onAudioRecord: (audioBlob: Blob, audioBase64: string) => void;
  onClear?: () => void;
  maxDuration?: number; // em segundos
  className?: string;
}

export function AudioRecorder({ 
  onAudioRecord, 
  onClear, 
  maxDuration = 300, // 5 minutos por padrão
  className 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Converter para base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioRecord(audioBlob, base64);
          setHasRecording(true);
        };
        reader.readAsDataURL(audioBlob);

        // Criar URL para playback
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioElementRef.current) {
          audioElementRef.current.src = audioUrl;
        }

        // Limpar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
      
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setError('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
      }
      setIsPaused(!isPaused);
    }
  };

  const playRecording = () => {
    if (audioElementRef.current && hasRecording) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearRecording = () => {
    stopRecording();
    setHasRecording(false);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.src = '';
    }
    if (onClear) {
      onClear();
    }
  };

  const downloadRecording = () => {
    if (audioElementRef.current && hasRecording) {
      const link = document.createElement('a');
      link.href = audioElementRef.current.src;
      link.download = `gravacao_${new Date().toISOString()}.webm`;
      link.click();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <div className="text-2xl font-mono mb-2">
            {formatTime(recordingTime)}
          </div>
          {maxDuration && (
            <div className="text-sm text-muted-foreground">
              Máximo: {formatTime(maxDuration)}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {!isRecording && !hasRecording && (
            <Button onClick={startRecording} size="lg" className="gap-2">
              <Mic className="w-5 h-5" />
              Gravar
            </Button>
          )}

          {isRecording && (
            <>
              <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2">
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {isPaused ? 'Continuar' : 'Pausar'}
              </Button>
              <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                <Square className="w-5 h-5" />
                Parar
              </Button>
            </>
          )}

          {hasRecording && !isRecording && (
            <>
              <Button onClick={playRecording} variant="outline" size="lg" className="gap-2">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pausar' : 'Reproduzir'}
              </Button>
              <Button onClick={downloadRecording} variant="outline" size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Baixar
              </Button>
              <Button onClick={clearRecording} variant="destructive" size="lg" className="gap-2">
                <Trash2 className="w-5 h-5" />
                Limpar
              </Button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                {isPaused ? 'Pausado' : 'Gravando...'}
              </span>
            </div>
          </div>
        )}

        <audio
          ref={audioElementRef}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
}