import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import * as THREE from "three";
import { CheckCircle2 } from "lucide-react";
import { nodeColor, nodeSize } from "../utils/graphBuilder.js";
import GraphLegend from "./GraphLegend.jsx";

const FraudGraph3D = ({ graphData, onNodeSelect }) => {
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 520 });

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(Math.floor(entry.contentRect.width), 320);
      setDimensions({ width, height: 520 });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      graphRef.current?.zoomToFit?.(700, 80);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [graphData.nodes.length]);

  const buildNodeObject = useCallback((node) => {
    const radius = nodeSize(node);
    const group = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshLambertMaterial({
        color: nodeColor(node),
        emissive: nodeColor(node),
        emissiveIntensity: node.type === "account" ? 0.32 : 0.18,
      }),
    );
    group.add(sphere);

    const label = new SpriteText(node.name);
    label.color = "#ffffff";
    label.textHeight = node.type === "account" ? 4 : 3.2;
    label.backgroundColor = nodeColor(node);
    label.borderRadius = 4;
    label.padding = 2;
    label.position.y = radius + 5;
    group.add(label);

    return group;
  }, []);

  const hasSuspiciousNodes = graphData.nodes.length > 1;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">3D Fraud Link Analysis</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rotate, zoom, pan, and click nodes for intelligence details.
          </p>
        </div>
        <GraphLegend />
      </div>
      <div ref={containerRef} className="relative h-[520px] overflow-hidden bg-slate-950">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#020617"
          rendererConfig={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          nodeThreeObject={buildNodeObject}
          nodeColor={nodeColor}
          showNavInfo={false}
          linkColor={() => "rgba(125, 211, 252, 0.72)"}
          linkWidth={(link) => 1 + (link.confidence || 0.5) * 2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={2}
          linkLabel={(link) => `Detected By | Confidence ${Math.round((link.confidence || 0) * 100)}%`}
          nodeLabel={(node) =>
            `${node.name}<br/>Model: ${node.modelName || "account"}<br/>Risk: ${node.risk}<br/>Confidence: ${Math.round((node.probability || 0) * 100)}%`
          }
          enableNodeDrag
          onNodeClick={(node) => {
            onNodeSelect(node.record || node);
            const distance = 80;
            const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
            graphRef.current?.cameraPosition?.(
              { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
              node,
              900,
            );
          }}
        />
        {!hasSuspiciousNodes && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/70 p-5 text-center text-emerald-100 backdrop-blur">
              <CheckCircle2 className="mx-auto h-9 w-9" />
              <p className="mt-3 text-sm font-semibold">No suspicious activity detected.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FraudGraph3D;
