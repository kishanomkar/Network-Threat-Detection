import { useMemo } from "react";
import TerminalLayout from "../../layouts/TerminalLayout";
import { useNetwork } from "../../context/NetworkContext";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

export default function DetailedGraphicAnalysis() {
  const { networkGraph } = useNetwork();

  /*
   * ============================================================
   * NORMALIZE BACKEND DATA
   * ============================================================
   *
   * Backend structure:
   *
   * {
   *   dataset: "PCAP",
   *   state_count: 1,
   *   graph_count: 1,
   *   latest_state_id: "...",
   *   timestamp: "...",
   *   graph: {
   *      links: [...]
   *   }
   * }
   *
   * Each link can contain:
   *
   * source
   * target
   * confidence
   * record.byte_count
   * record.packet_count
   * record.flow_count
   * record.protocol_counts
   */

  const graphData = useMemo(() => {
    const graph = networkGraph?.graph;

    if (!graph) {
      return {
        nodes: [],
        links: [],
      };
    }

    const rawLinks = Array.isArray(graph.links)
      ? graph.links
      : [];

    const nodeMap = new Map();

    const links = rawLinks.map((link, index) => {
      const source =
        typeof link.source === "object"
          ? link.source
          : {
              id: link.source,
              name: link.source,
            };

      const target =
        typeof link.target === "object"
          ? link.target
          : {
              id: link.target,
              name: link.target,
            };

      if (source?.id) {
        nodeMap.set(source.id, {
          ...source,
          id: source.id,
          name: source.name || source.id,
          risk: source.risk || "UNKNOWN",
          probability: Number(source.probability || 0),
        });
      }

      if (target?.id) {
        nodeMap.set(target.id, {
          ...target,
          id: target.id,
          name: target.name || target.id,
          risk: target.risk || "UNKNOWN",
          probability: Number(target.probability || 0),
        });
      }

      return {
        ...link,

        id: link.id || `connection-${index}`,

        source,
        target,

        confidence: Number(
          link.confidence || 0
        ),

        byteCount: Number(
          link.record?.byte_count || 0
        ),

        packetCount: Number(
          link.record?.packet_count || 0
        ),

        flowCount: Number(
          link.record?.flow_count || 0
        ),

        protocolCounts:
          link.record?.protocol_counts || {},
      };
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }, [networkGraph]);


  const nodes = graphData.nodes;
  const links = graphData.links;


  /*
   * ============================================================
   * BASIC METRICS
   * ============================================================
   */

  const totalHosts = nodes.length;

  const totalConnections = links.length;

  const criticalHosts = nodes.filter(
    (node) =>
      String(node.risk).toUpperCase() ===
      "CRITICAL"
  ).length;

  const highHosts = nodes.filter(
    (node) =>
      String(node.risk).toUpperCase() ===
      "HIGH"
  ).length;

  const mediumHosts = nodes.filter(
    (node) =>
      String(node.risk).toUpperCase() ===
      "MEDIUM"
  ).length;

  const lowHosts = nodes.filter(
    (node) =>
      String(node.risk).toUpperCase() ===
      "LOW"
  ).length;


  const totalPackets = links.reduce(
    (sum, link) =>
      sum + link.packetCount,
    0
  );

  const totalFlows = links.reduce(
    (sum, link) =>
      sum + link.flowCount,
    0
  );

  const totalBytes = links.reduce(
    (sum, link) =>
      sum + link.byteCount,
    0
  );


  const averageConfidence =
    links.length > 0
      ? links.reduce(
          (sum, link) =>
            sum + link.confidence,
          0
        ) / links.length
      : 0;


  /*
   * ============================================================
   * RISK DISTRIBUTION
   * ============================================================
   */

  const riskData = [
    {
      name: "CRITICAL",
      value: criticalHosts,
    },
    {
      name: "HIGH",
      value: highHosts,
    },
    {
      name: "MEDIUM",
      value: mediumHosts,
    },
    {
      name: "LOW",
      value: lowHosts,
    },
  ].filter(
    (item) => item.value > 0
  );


  /*
   * ============================================================
   * PROTOCOL DISTRIBUTION
   * ============================================================
   */

  const protocolMap = {};

  links.forEach((link) => {
    Object.entries(
      link.protocolCounts || {}
    ).forEach(
      ([protocol, count]) => {
        protocolMap[protocol] =
          (protocolMap[protocol] || 0) +
          Number(count || 0);
      }
    );
  });


  const protocolData = Object.entries(
    protocolMap
  )
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort(
      (a, b) =>
        b.value - a.value
    );


  /*
   * ============================================================
   * TOP COMMUNICATION LINKS
   * ============================================================
   */

  const topConnections = links
    .map((link) => ({
      name: `${getHostName(
        link.source
      )} → ${getHostName(
        link.target
      )}`,

      bytes: link.byteCount,

      packets: link.packetCount,

      flows: link.flowCount,

      confidence:
        link.confidence * 100,
    }))
    .sort(
      (a, b) =>
        b.bytes - a.bytes
    )
    .slice(0, 10);


  /*
   * ============================================================
   * HOST TRAFFIC
   * ============================================================
   */

  const hostTrafficMap = {};

  nodes.forEach((node) => {
    hostTrafficMap[node.id] = {
      host:
        node.name ||
        node.id,

      sent: Number(
        node.record?.bytes_sent || 0
      ),

      received: Number(
        node.record?.bytes_received || 0
      ),

      probability:
        Number(
          node.probability || 0
        ) * 100,

      risk:
        node.risk || "UNKNOWN",
    };
  });


  links.forEach((link) => {
    const sourceId =
      typeof link.source === "object"
        ? link.source.id
        : link.source;

    const targetId =
      typeof link.target === "object"
        ? link.target.id
        : link.target;

    if (!hostTrafficMap[sourceId]) {
      hostTrafficMap[sourceId] = {
        host: sourceId,
        sent: 0,
        received: 0,
        probability: 0,
        risk: "UNKNOWN",
      };
    }

    if (!hostTrafficMap[targetId]) {
      hostTrafficMap[targetId] = {
        host: targetId,
        sent: 0,
        received: 0,
        probability: 0,
        risk: "UNKNOWN",
      };
    }

    hostTrafficMap[sourceId].sent +=
      link.byteCount;

    hostTrafficMap[targetId].received +=
      link.byteCount;
  });


  const hostTrafficData =
    Object.values(hostTrafficMap)
      .sort(
        (a, b) =>
          b.sent +
          b.received -
          (a.sent +
            a.received)
      )
      .slice(0, 12);


  /*
   * ============================================================
   * HOST RISK PROBABILITY
   * ============================================================
   */

  const probabilityData = nodes
    .map((node) => ({
      host:
        node.name ||
        node.id,

      probability:
        Number(
          node.probability || 0
        ) * 100,

      risk:
        node.risk ||
        "UNKNOWN",
    }))
    .sort(
      (a, b) =>
        b.probability -
        a.probability
    )
    .slice(0, 12);


  /*
   * ============================================================
   * LINK ACTIVITY
   * ============================================================
   */

  const activityData = links
    .slice(0, 25)
    .map((link, index) => ({
      link: index + 1,

      packets:
        link.packetCount,

      flows:
        link.flowCount,

      bytes:
        link.byteCount,
    }));


  /*
   * ============================================================
   * CONFIDENCE DISTRIBUTION
   * ============================================================
   */

  const confidenceData = links
    .slice(0, 20)
    .map((link, index) => ({
      link: `L${index + 1}`,

      confidence:
        Number(
          link.confidence || 0
        ) * 100,
    }));


  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <TerminalLayout
      title="Detailed Graphic Analysis"
    >

      <div className="space-y-4 font-mono">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />

                <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Detailed Graphic Analysis
                </h1>

              </div>

              <p className="text-[10px] text-slate-500 mt-2">
                Deep visual analysis of network
                behaviour extracted from PCAP
                graph telemetry.
              </p>

            </div>


            <div className="flex flex-wrap gap-5">

              <InfoItem
                label="DATASET"
                value={
                  networkGraph?.dataset ||
                  "PCAP"
                }
              />

              <InfoItem
                label="GRAPH COUNT"
                value={
                  networkGraph?.graph_count ??
                  1
                }
              />

              <InfoItem
                label="STATE COUNT"
                value={
                  networkGraph?.state_count ??
                  1
                }
              />

              <InfoItem
                label="STATUS"
                value="ANALYZED"
                valueClass="text-emerald-400"
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            KPI GRID
        ===================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">

          <MetricCard
            label="TOTAL HOSTS"
            value={totalHosts}
            valueClass="text-cyan-400"
          />

          <MetricCard
            label="CONNECTIONS"
            value={totalConnections}
            valueClass="text-blue-400"
          />

          <MetricCard
            label="CRITICAL"
            value={criticalHosts}
            valueClass="text-red-400"
          />

          <MetricCard
            label="HIGH RISK"
            value={highHosts}
            valueClass="text-orange-400"
          />

          <MetricCard
            label="PACKETS"
            value={totalPackets.toLocaleString()}
            valueClass="text-purple-400"
          />

          <MetricCard
            label="FLOWS"
            value={totalFlows.toLocaleString()}
            valueClass="text-indigo-400"
          />

          <MetricCard
            label="TRAFFIC"
            value={formatBytes(
              totalBytes
            )}
            valueClass="text-emerald-400"
          />

          <MetricCard
            label="CONFIDENCE"
            value={`${Math.round(
              averageConfidence * 100
            )}%`}
            valueClass="text-amber-400"
          />

        </div>


        {/* ====================================================
            RISK + PROTOCOL
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


          {/* RISK */}

          <Panel
            title="HOST RISK DISTRIBUTION"
            subtitle="Distribution of detected network entities by risk level"
          >

            {riskData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <PieChart>

                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >

                    {riskData.map(
                      (entry) => (
                        <Cell
                          key={
                            entry.name
                          }
                          fill={
                            getRiskColor(
                              entry.name
                            )
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize:
                        "10px",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>


          {/* PROTOCOL */}

          <Panel
            title="PROTOCOL DISTRIBUTION"
            subtitle="Network packets categorized by protocol"
          >

            {protocolData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={protocolData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a2333"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Bar
                    dataKey="value"
                    fill="#22d3ee"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>

        </div>


        {/* ====================================================
            COMMUNICATION LINKS
        ===================================================== */}

        <Panel
          title="COMMUNICATION LINK ANALYSIS"
          subtitle="Highest-volume host-to-host communication relationships"
        >

          {topConnections.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <BarChart
                data={topConnections}
                layout="vertical"
                margin={{
                  left: 40,
                  right: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a2333"
                />

                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={9}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={190}
                  stroke="#64748b"
                  fontSize={8}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                  formatter={(value) =>
                    formatBytes(
                      value
                    )
                  }
                />

                <Bar
                  dataKey="bytes"
                  fill="#818cf8"
                  radius={[
                    0,
                    3,
                    3,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (
            <EmptyChart height={350} />
          )}

        </Panel>


        {/* ====================================================
            TRAFFIC + RISK PROBABILITY
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


          {/* HOST TRAFFIC */}

          <Panel
            title="HOST TRAFFIC PROFILE"
            subtitle="Outbound and inbound traffic volume by host"
          >

            {hostTrafficData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <BarChart
                  data={hostTrafficData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a2333"
                  />

                  <XAxis
                    dataKey="host"
                    stroke="#64748b"
                    fontSize={8}
                    tickFormatter={(
                      value
                    ) =>
                      String(
                        value
                      ).slice(-12)
                    }
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      value
                    ) =>
                      formatBytes(
                        value
                      )
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize:
                        "10px",
                    }}
                  />

                  <Bar
                    dataKey="sent"
                    name="Sent"
                    fill="#22d3ee"
                  />

                  <Bar
                    dataKey="received"
                    name="Received"
                    fill="#a78bfa"
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>


          {/* RISK PROBABILITY */}

          <Panel
            title="HOST RISK PROBABILITY"
            subtitle="Probability score generated by network behaviour analysis"
          >

            {probabilityData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <BarChart
                  data={probabilityData}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a2333"
                  />

                  <XAxis
                    type="number"
                    domain={[
                      0,
                      100,
                    ]}
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <YAxis
                    type="category"
                    dataKey="host"
                    width={140}
                    stroke="#64748b"
                    fontSize={8}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      value
                    ) =>
                      `${Number(
                        value
                      ).toFixed(
                        1
                      )}%`
                    }
                  />

                  <Bar
                    dataKey="probability"
                    fill="#f43f5e"
                    radius={[
                      0,
                      3,
                      3,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>

        </div>


        {/* ====================================================
            PACKET / FLOW ACTIVITY
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


          {/* PACKETS */}

          <Panel
            title="PACKET & FLOW ACTIVITY"
            subtitle="Communication activity across graph links"
          >

            {activityData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <AreaChart
                  data={activityData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a2333"
                  />

                  <XAxis
                    dataKey="link"
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize:
                        "10px",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="packets"
                    name="Packets"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={
                      0.12
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="flows"
                    name="Flows"
                    stroke="#a78bfa"
                    fill="#a78bfa"
                    fillOpacity={
                      0.12
                    }
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>


          {/* CONFIDENCE */}

          <Panel
            title="LINK CONFIDENCE ANALYSIS"
            subtitle="Confidence score associated with each detected relationship"
          >

            {confidenceData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={
                    confidenceData
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a2333"
                  />

                  <XAxis
                    dataKey="link"
                    stroke="#64748b"
                    fontSize={8}
                  />

                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      value
                    ) =>
                      `${Number(
                        value
                      ).toFixed(
                        1
                      )}%`
                    }
                  />

                  <Bar
                    dataKey="confidence"
                    fill="#f59e0b"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <EmptyChart />
            )}

          </Panel>

        </div>


        {/* ====================================================
            DETAILED COMMUNICATION TABLE
        ===================================================== */}

        <div className="bg-[#0d121f] border border-[#1a2333] rounded-sm overflow-hidden">

          <div className="p-4 border-b border-[#1a2333]">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                  Detailed Communication Records
                </h3>

                <p className="text-[9px] text-slate-600 mt-1">
                  Link-level inspection of the
                  PCAP network behaviour graph
                </p>

              </div>

              <div className="text-[10px] text-slate-500">
                {links.length} RECORDS
              </div>

            </div>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-[10px]">

              <thead className="bg-[#080c14] text-slate-500 uppercase">

                <tr>

                  <th className="px-4 py-3">
                    #
                  </th>

                  <th className="px-4 py-3">
                    Source
                  </th>

                  <th className="px-4 py-3">
                    Target
                  </th>

                  <th className="px-4 py-3">
                    Protocol
                  </th>

                  <th className="px-4 py-3">
                    Packets
                  </th>

                  <th className="px-4 py-3">
                    Flows
                  </th>

                  <th className="px-4 py-3">
                    Bytes
                  </th>

                  <th className="px-4 py-3">
                    Confidence
                  </th>

                  <th className="px-4 py-3">
                    Risk
                  </th>

                </tr>

              </thead>


              <tbody>

                {links
                  .slice(0, 50)
                  .map(
                    (
                      link,
                      index
                    ) => {

                      const protocols =
                        Object.entries(
                          link.protocolCounts ||
                            {}
                        )
                          .map(
                            ([
                              protocol,
                              count,
                            ]) =>
                              `${protocol}:${count}`
                          )
                          .join(
                            " / "
                          );

                      const sourceRisk =
                        typeof link.source ===
                        "object"
                          ? link
                              .source
                              ?.risk
                          : "UNKNOWN";

                      return (
                        <tr
                          key={
                            link.id ||
                            index
                          }
                          className="border-t border-[#1a2333] hover:bg-[#111827] transition-colors"
                        >

                          <td className="px-4 py-3 text-slate-600">
                            {index +
                              1}
                          </td>

                          <td className="px-4 py-3 text-cyan-400 whitespace-nowrap">
                            {getHostName(
                              link.source
                            )}
                          </td>

                          <td className="px-4 py-3 text-purple-400 whitespace-nowrap">
                            {getHostName(
                              link.target
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {protocols ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {link.packetCount.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {link.flowCount.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {formatBytes(
                              link.byteCount
                            )}
                          </td>

                          <td className="px-4 py-3 text-amber-400">
                            {Math.round(
                              link.confidence *
                                100
                            )}
                            %
                          </td>

                          <td
                            className={`px-4 py-3 font-bold ${getRiskText(
                              sourceRisk
                            )}`}
                          >
                            {
                              sourceRisk ||
                              "UNKNOWN"
                            }
                          </td>

                        </tr>
                      );
                    }
                  )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ====================================================
            GRAPH STATE INFORMATION
        ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <InfoPanel
            label="LATEST STATE ID"
            value={
              networkGraph?.latest_state_id ||
              "N/A"
            }
          />

          <InfoPanel
            label="ANALYSIS TIMESTAMP"
            value={
              networkGraph?.timestamp
                ? new Date(
                    networkGraph.timestamp
                  ).toLocaleString()
                : "N/A"
            }
          />

          <InfoPanel
            label="DATA SOURCE"
            value={
              networkGraph?.dataset ||
              "PCAP"
            }
          />

        </div>

      </div>

    </TerminalLayout>
  );
}


/* =============================================================
   COMPONENTS
============================================================= */

function MetricCard({
  label,
  value,
  valueClass,
}) {
  return (
    <div className="bg-[#0d121f] border border-[#1a2333] p-3 rounded-sm">

      <span className="block text-[9px] text-slate-600">
        {label}
      </span>

      <span
        className={`block mt-1 text-sm font-bold ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
}


function InfoItem({
  label,
  value,
  valueClass = "text-slate-300",
}) {
  return (
    <div>

      <span className="block text-[8px] text-slate-600 uppercase">
        {label}
      </span>

      <span
        className={`block text-[10px] font-bold mt-1 ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
}


function Panel({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="bg-[#0d121f] border border-[#1a2333] rounded-sm p-4">

      <div className="mb-2">

        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {title}
        </h3>

        <p className="text-[9px] text-slate-600 mt-1">
          {subtitle}
        </p>

      </div>

      {children}

    </div>
  );
}


function EmptyChart({
  height = 300,
}) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height,
      }}
    >

      <span className="text-[10px] text-slate-600 italic">
        No analytics data available.
      </span>

    </div>
  );
}


function InfoPanel({
  label,
  value,
}) {
  return (
    <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">

      <span className="text-[9px] text-slate-600 uppercase block">
        {label}
      </span>

      <span className="text-[10px] text-cyan-400 font-bold mt-2 block break-all">
        {value}
      </span>

    </div>
  );
}


/* =============================================================
   HELPERS
============================================================= */

function getHostName(host) {
  if (!host) {
    return "UNKNOWN";
  }

  if (typeof host === "object") {
    return (
      host.name ||
      host.id ||
      "UNKNOWN"
    );
  }

  return host;
}


function formatBytes(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 *
      1024 *
      1024
  ) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 *
      1024 *
      1024)
  ).toFixed(1)} GB`;
}


function getRiskColor(risk) {
  switch (
    String(risk).toUpperCase()
  ) {
    case "CRITICAL":
      return "#ef4444";

    case "HIGH":
      return "#f97316";

    case "MEDIUM":
      return "#f59e0b";

    case "LOW":
      return "#10b981";

    default:
      return "#64748b";
  }
}


function getRiskText(risk) {
  switch (
    String(risk).toUpperCase()
  ) {
    case "CRITICAL":
      return "text-red-400";

    case "HIGH":
      return "text-orange-400";

    case "MEDIUM":
      return "text-amber-400";

    case "LOW":
      return "text-emerald-400";

    default:
      return "text-slate-500";
  }
}


const tooltipStyle = {
  backgroundColor:
    "#080c14",

  border:
    "1px solid #263246",

  color:
    "#e2e8f0",

  fontSize:
    "11px",

  fontFamily:
    "monospace",
};