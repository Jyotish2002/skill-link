// components/ConnectionStatus.js
import { useEffect, useState } from "react";
import { CircleCheck, CircleDashed, CircleAlert } from "lucide-react";

export default function ConnectionStatus({ peerConnection }) {
  const [status, setStatus] = useState("new");
  const [stats, setStats] = useState({
    bitrate: 0,
    packetLoss: 0,
    latency: 0,
  });

  useEffect(() => {
    if (!peerConnection) return;

    // Update connection state
    const handleConnectionStateChange = () => {
      setStatus(peerConnection.connectionState);
    };

    peerConnection.addEventListener(
      "connectionstatechange",
      handleConnectionStateChange
    );

    // Initial state
    setStatus(peerConnection.connectionState);

    // Stats collection interval
    let lastBytesSent = 0;
    let lastTimestamp = 0;

    const statsInterval = setInterval(async () => {
      if (peerConnection.connectionState === "connected") {
        try {
          const stats = await peerConnection.getStats();

          stats.forEach((report) => {
            if (report.type === "outbound-rtp" && report.kind === "video") {
              const now = report.timestamp;

              // Calculate bitrate
              if (lastTimestamp > 0) {
                const bitrate = Math.floor(
                  ((report.bytesSent - lastBytesSent) * 8) /
                    ((now - lastTimestamp) / 1000)
                );

                setStats((prev) => ({
                  ...prev,
                  bitrate: bitrate / 1024, // Convert to Kbps
                }));
              }

              lastBytesSent = report.bytesSent;
              lastTimestamp = now;

              // Packet loss
              if (report.packetsSent) {
                const lossRate = report.packetsLost
                  ? (report.packetsLost / report.packetsSent) * 100
                  : 0;

                setStats((prev) => ({
                  ...prev,
                  packetLoss: parseFloat(lossRate.toFixed(1)),
                }));
              }
            }

            // Current delay (RTT)
            if (report.type === "candidate-pair" && report.nominated) {
              setStats((prev) => ({
                ...prev,
                latency: report.currentRoundTripTime
                  ? Math.floor(report.currentRoundTripTime * 1000)
                  : prev.latency,
              }));
            }
          });
        } catch (err) {
          console.error("Error getting connection stats:", err);
        }
      }
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      peerConnection.removeEventListener(
        "connectionstatechange",
        handleConnectionStateChange
      );
    };
  }, [peerConnection]);

  const getStatusDetails = () => {
    switch (status) {
      case "new":
        return {
          label: "Initializing",
          color: "text-gray-500 bg-gray-100",
          icon: <CircleDashed className="h-4 w-4" />,
        };
      case "connecting":
        return {
          label: "Connecting",
          color: "text-yellow-600 bg-yellow-100",
          icon: <CircleDashed className="h-4 w-4 animate-pulse" />,
        };
      case "connected":
        return {
          label: "Connected",
          color: "text-green-600 bg-green-100",
          icon: <CircleCheck className="h-4 w-4" />,
        };
      case "disconnected":
        return {
          label: "Disconnected",
          color: "text-orange-600 bg-orange-100",
          icon: <CircleAlert className="h-4 w-4" />,
        };
      case "failed":
        return {
          label: "Connection Failed",
          color: "text-red-600 bg-red-100",
          icon: <CircleAlert className="h-4 w-4" />,
        };
      case "closed":
        return {
          label: "Call Ended",
          color: "text-gray-600 bg-gray-100",
          icon: <CircleCheck className="h-4 w-4" />,
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-600 bg-gray-100",
          icon: <CircleDashed className="h-4 w-4" />,
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusDetails.color}`}
      >
        {statusDetails.icon}
        <span className="text-xs font-medium">{statusDetails.label}</span>
      </div>

      {status === "connected" && (
        <div className="mt-1 text-xs text-gray-500 flex flex-col">
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="flex flex-col items-center">
              <span className="font-medium">
                {stats.bitrate.toFixed(0)} Kbps
              </span>
              <span className="text-2xs opacity-75">Bitrate</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">{stats.latency} ms</span>
              <span className="text-2xs opacity-75">Latency</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">{stats.packetLoss}%</span>
              <span className="text-2xs opacity-75">Loss</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
