"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  PhoneOff,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import ConnectionStatus from "../_components/ConnectionStatus";
import CallChat from "../_components/CallChat";
import toast from "react-hot-toast";

export default function CallPage({ user }) {
  const router = useRouter();
  const { sessionId } = useParams();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const socketRef = useRef(null); // Added missing reference

  // WebSocket ref for signaling
  const wsRef = useRef(null);

  // Fetch session data
  useEffect(() => {
    async function fetchSessionData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch session data");
        }

        const data = await response.json();
        setSessionData(data);

        // Update session status to "in-progress" when the call page is loaded
        if (data.status === "confirmed") {
          await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "active",
            }),
          });
        }
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSessionData();
    }
  }, [sessionId, user]);

  // Initialize WebRTC and signaling
  useEffect(() => {
    if (!sessionData || !user) return;

    // Cleanup function to stop all media streams and close connections
    const cleanup = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };

    // Setup WebRTC peer connection
    const setupPeerConnection = () => {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.google.com:19302" },
          {
            urls: "turn:your-turn-server.com:3478",
            username: "username",
            credential: "password",
          },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          peerConnectionRef.current.iceConnectionState
        );
      };

      peerConnectionRef.current.onicegatheringstatechange = () => {
        console.log(
          "ICE gathering state:",
          peerConnectionRef.current.iceGatheringState
        );
      };

      peerConnectionRef.current.onsignalingstatechange = () => {
        console.log(
          "Signaling state:",
          peerConnectionRef.current.signalingState
        );
      };

      // Event handlers for peer connection
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              userId: user.id,
              sessionId,
            })
          );
        } else {
          console.log("All ICE candidates gathered");
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams?.[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log(
          "Connection state:",
          peerConnectionRef.current.connectionState
        );

        if (peerConnectionRef.current.connectionState === "connected") {
          toast.success(
            `You are now connected with ${
              sessionData.mentor_id === user.id
                ? sessionData.learner_name
                : sessionData.mentor_name
            }`
          );
        } else if (peerConnectionRef.current.connectionState === "failed") {
          toast.error(
            "Unable to establish a connection. Try refreshing the page."
          );
        } else if (
          peerConnectionRef.current.connectionState === "disconnected"
        ) {
          toast.error("The other participant has disconnected.");
        }
      };

      // Set up data channel
      dataChannelRef.current = peerConnectionRef.current.createDataChannel(
        "messaging",
        {
          ordered: true,
        }
      );

      dataChannelRef.current.onopen = () => {
        console.log("Data channel opened");
      };

      dataChannelRef.current.onclose = () => {
        console.log("Data channel closed");
      };

      // Handle data channel from other peer
      peerConnectionRef.current.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
      };
    };

    // Get media and initialize WebRTC
    const initializeMedia = async () => {
      // Setup peer connection first
      setupPeerConnection();

      try {
        // Try to get media with requested constraints
        const constraints = {
          audio: isAudioEnabled,
          video: isVideoEnabled
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
        };

        console.log("Requesting media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log(
          "Media access granted:",
          stream.getTracks().map((t) => t.kind)
        );
        localStreamRef.current = stream;

        // Set local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Initialize WebSocket for signaling
        initializeWebSocket();
      } catch (err) {
        console.error("Media access error:", err.name, err.message);

        // Handle specific media errors
        if (err.name === "NotAllowedError") {
          toast.error(
            "Camera/microphone access denied. Please grant permission in your browser settings."
          );
        } else if (err.name === "NotFoundError") {
          toast.error("No camera or microphone found on your device.");
        } else if (err.name === "NotReadableError") {
          toast.error(
            "Your camera or microphone is already in use by another application."
          );
        } else {
          toast.error(`Failed to access media devices: ${err.message}`);
        }

        // Try fallback to audio-only if video failed and video was requested
        if (isVideoEnabled) {
          toast.info("Trying audio only...");
          setIsVideoEnabled(false);

          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });

            localStreamRef.current = audioOnlyStream;

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = audioOnlyStream;
            }

            // Add tracks to peer connection
            audioOnlyStream.getTracks().forEach((track) => {
              peerConnectionRef.current.addTrack(track, audioOnlyStream);
            });

            // Initialize WebSocket for signaling
            initializeWebSocket();
          } catch (audioErr) {
            console.error("Audio fallback failed:", audioErr);
            toast.error(
              "Could not access any media devices. Check your hardware and permissions."
            );
            setError(
              "Failed to access media devices. Please check your hardware and permissions."
            );
          }
        } else {
          setError(
            "Failed to access media devices. Please check your hardware and permissions."
          );
        }
      }
    };

    const initializeWebSocket = () => {
      // Initialize WebSocket for signaling
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/call/${sessionId}`;
      console.log("Attempting to connect to WebSocket at:", wsUrl);

      wsRef.current.onopen = () => {
        // Identify user role to the server
        wsRef.current.send(
          JSON.stringify({
            type: "join",
            userId: user.id,
            sessionId,
            userName: user.name, // Adding name for logging
            isMentor: sessionData.mentor_id === user.id,
          })
        );

        // If user is the mentor, they create and send the offer
        if (sessionData.mentor_id === user.id) {
          createOffer();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (retryCount < 3) {
          toast.info(`Connection failed, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => initializeWebSocket(retryCount + 1), 2000);
        } else {
          setError("Connection error. Please try again.");
          toast.error(
            "Failed to connect to signaling server after multiple attempts."
          );
        }
      };

      wsRef.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "offer":
            if (sessionData.mentor_id !== user.id) {
              await handleOffer(message.offer);
            }
            break;

          case "answer":
            if (sessionData.mentor_id === user.id) {
              await handleAnswer(message.answer);
            }
            break;

          case "ice-candidate":
            handleIceCandidate(message.candidate);
            break;

          case "user-joined":
            toast.success("The other participant has joined the call.");
            break;

          case "user-left":
            toast.error("The other participant has left the call.");
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try again.");
        toast.error("Failed to connect to signaling server.");
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    };

    // Start the initialization process
    initializeMedia();

    // Clean up function
    return cleanup;
  }, [sessionData, user, sessionId, isAudioEnabled, isVideoEnabled]);

  // WebRTC functions
  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      wsRef.current.send(
        JSON.stringify({
          type: "offer",
          offer,
          userId: user.id,
          sessionId,
        })
      );
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to create connection offer");
    }
  };

  const handleOffer = async (offer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      wsRef.current.send(
        JSON.stringify({
          type: "answer",
          answer,
          userId: user.id,
          sessionId,
        })
      );
    } catch (err) {
      console.error("Error handling offer:", err);
      toast.error("Failed to handle connection offer");
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error("Error handling answer:", err);
      toast.error("Failed to establish connection");
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  // Media control functions
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !isAudioEnabled;
        });
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !isVideoEnabled;
        });
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isAudioEnabled,
        });

        // Replace tracks in the connection
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        // Update local video
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          localStreamRef.current = stream;
          audioTracks.forEach((track) => stream.addTrack(track));
        } else {
          localStreamRef.current = stream;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(false);

        toast.success("Returned to camera view");
      } catch (err) {
        console.error("Error reverting to camera:", err);
        toast.error("Failed to switch back to camera");
      }
    } else {
      // Share screen
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
        });

        // Replace tracks in the connection
        const videoTrack = stream.getVideoTracks()[0];

        videoTrack.onended = () => {
          toggleScreenShare();
        };

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        // Update local video
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(true);

        toast.success("You are now sharing your screen");
      } catch (err) {
        console.error("Error sharing screen:", err);
        toast.error("Unable to share your screen");
      }
    }
  };

  const endCall = async () => {
    try {
      // Update session status to completed
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close connections
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      if (wsRef.current) {
        wsRef.current.close();
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error ending call:", err);
      toast.error("Failed to end call properly");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading call session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Error: {error || "Session not found"}
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentUserId = user.id;
  const isMentor = sessionData.mentor_id === currentUserId;
  const otherPartyName = isMentor
    ? sessionData.learner_name
    : sessionData.mentor_name;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Call header */}
      <div className="bg-white border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Session with {otherPartyName}
            </h1>
            <p className="text-sm text-gray-500">
              {format(
                new Date(sessionData.start_time),
                "MMMM d, yyyy • h:mm a"
              )}{" "}
              - {format(new Date(sessionData.end_time), "h:mm a")}
            </p>
          </div>
          <div className="flex items-center">
            {peerConnectionRef.current && (
              <ConnectionStatus peerConnection={peerConnectionRef.current} />
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Your video */}
          <div className="aspect-video relative">
            <Card className="h-full">
              <CardContent className="p-0 h-full flex items-center justify-center bg-gray-800 relative overflow-hidden">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center text-white">
                      <div className="bg-gray-700 p-4 rounded-full mx-auto mb-2">
                        <VideoOff size={32} />
                      </div>
                      <p>Your camera is off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-md text-white text-sm flex items-center">
                  <span>{user.name || "You"}</span>
                  {!isAudioEnabled && (
                    <MicOff size={16} className="ml-2 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Remote video */}
          <div className="aspect-video relative">
            <Card className="h-full">
              <CardContent className="p-0 h-full flex items-center justify-center bg-gray-800 relative overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-md text-white text-sm">
                  <span>{otherPartyName}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto flex justify-center">
          <div className="flex space-x-3">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>

            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            <Button
              variant={isScreenSharing ? "secondary" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
            >
              <ScreenShare size={20} />
            </Button>

            <Button
              variant={isChatOpen ? "secondary" : "outline"}
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageSquare size={20} />
            </Button>

            <Button variant="destructive" size="icon" onClick={endCall}>
              <PhoneOff size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      {isChatOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-10">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
              >
                &times;
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              <CallChat
                dataChannel={dataChannelRef.current}
                sessionId={sessionId}
                user={user}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
