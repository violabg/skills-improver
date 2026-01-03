"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  Panel,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

interface Skill {
  id: string;
  name: string;
  category: string;
  domain?: string | null;
  fromRelations: Array<{
    id: string;
    strength: number;
    toSkill: {
      id: string;
      name: string;
    };
  }>;
}

interface SkillGraphProps {
  skills: Skill[];
}

const categoryColors = {
  HARD: "#3b82f6", // blue
  SOFT: "#10b981", // green
  META: "#8b5cf6", // purple
};

export function SkillGraph({ skills }: SkillGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const buildGraph = useCallback(
    (filterCategory?: string | null) => {
      const filteredSkills = filterCategory
        ? skills.filter((s) => s.category === filterCategory)
        : skills;

      // Create nodes in a circular layout
      const radius = 300;
      const centerX = 400;
      const centerY = 300;

      const newNodes: Node[] = filteredSkills.map((skill, idx) => {
        const angle = (idx / filteredSkills.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: skill.id,
          type: "default",
          position: { x, y },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium text-sm">{skill.name}</div>
                <Badge
                  variant="secondary"
                  className="mt-1 text-xs"
                  style={{
                    backgroundColor:
                      categoryColors[
                        skill.category as keyof typeof categoryColors
                      ] + "20",
                    color:
                      categoryColors[
                        skill.category as keyof typeof categoryColors
                      ],
                  }}
                >
                  {skill.category}
                </Badge>
              </div>
            ),
          },
          style: {
            background: "#fff",
            border: `2px solid ${
              categoryColors[skill.category as keyof typeof categoryColors]
            }`,
            borderRadius: "8px",
            padding: "10px",
            width: 150,
          },
        };
      });

      // Create edges
      const newEdges: Edge[] = [];
      const skillIds = new Set(filteredSkills.map((s) => s.id));

      for (const skill of filteredSkills) {
        for (const rel of skill.fromRelations) {
          // Only include edges where both nodes are in the filtered set
          if (skillIds.has(rel.toSkill.id)) {
            newEdges.push({
              id: rel.id,
              source: skill.id,
              target: rel.toSkill.id,
              type: "smoothstep",
              label: `${rel.strength}x`,
              labelStyle: { fontSize: 10, fill: "#666" },
              labelBgStyle: { fill: "#fff" },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color:
                  categoryColors[skill.category as keyof typeof categoryColors],
              },
              style: {
                stroke:
                  categoryColors[skill.category as keyof typeof categoryColors],
                strokeWidth: rel.strength > 0.8 ? 2 : 1,
              },
              animated: rel.strength >= 1.0,
            });
          }
        }
      }

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [skills, setNodes, setEdges]
  );

  useEffect(() => {
    buildGraph(selectedCategory);
  }, [buildGraph, selectedCategory]);

  return (
    <Card className="overflow-hidden">
      <div style={{ width: "100%", height: "600px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <Panel
            position="top-right"
            className="bg-card shadow-lg p-4 border border-border rounded-lg"
          >
            <div className="space-y-2">
              <p className="font-medium text-foreground text-sm">
                Filter by Category
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All Skills
                </button>
                {Object.entries(categoryColors).map(([cat, color]) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedCategory === cat
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    style={
                      selectedCategory === cat
                        ? { backgroundColor: color }
                        : undefined
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </Card>
  );
}
