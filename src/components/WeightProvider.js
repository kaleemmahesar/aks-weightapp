import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setWeight } from "../redux/slices/weightSlice";

export default function WeightProvider({ simulation = false, wsPort = 9091 }) {
  const wsRef = useRef(null);
  const dispatch = useDispatch();
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (simulation) {
      // Simulation mode: random weights
      const interval = setInterval(() => {
        const weight = +(Math.random() * 100).toFixed(1);
        dispatch(setWeight(weight));
      }, 3000);

      return () => clearInterval(interval);
    }

    // Live mode: connect WebSocket
    wsRef.current = new WebSocket(`ws://localhost:${wsPort}`);

    wsRef.current.onopen = () => {
      setStatus("✅ WebSocket connected");
      console.log("WebSocket connected");
    };

    wsRef.current.onmessage = (event) => {
      console.log("Raw WS message:", event.data);
      try {
        const parsed = JSON.parse(event.data);
        console.log("Parsed WS message:", parsed);

        if (parsed.weight !== undefined && parsed.weight !== null) {
          const numericWeight = Number(parsed.weight); // convert string → number
          dispatch(setWeight(numericWeight));
          console.log("Dispatched weight:", numericWeight);
        }
      } catch (err) {
        console.error("Invalid WS message:", event.data, err);
      }
    };

    wsRef.current.onclose = () => {
      console.warn("WebSocket closed");
      setStatus("WebSocket disconnected");
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStatus("WebSocket error");
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [simulation, dispatch, wsPort]);

  return null; // No UI, background service
}
