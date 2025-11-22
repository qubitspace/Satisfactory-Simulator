# Satisfactory Simulator: Flow Factory

## Technical Game Concept
This project is a **Flow Network Optimization** simulation built with Phaser 3 and TypeScript.
Unlike traditional factory games (Factorio) that simulate individual item physics and collision, this engine simulates **Graph Theory**.

### The "Magic Belt" System
*   **Nodes**: Factories (Vertices).
*   **Belts**: Connections (Edges) that define the topology of the network.
*   **Simulation**: 
    *   The game runs a **Flow Calculation** tick (1Hz).
    *   It groups connected nodes into **Clusters**.
    *   It calculates `Total Supply` vs `Total Demand` for each resource in the cluster.
    *   It distributes resources instantaneously based on efficiency ratios.
    *   **Supply < Demand**: All machines slow down uniformly (Global Efficiency).
    *   **Supply >= Demand**: All machines run at 100%.

## The End Goal: Project Assembly
The objective of the game is to solve a series of **Throughput Constraints**.
The player does not "hoard" items. The player must "prove" a sustained production rate.

### Progression System (Milestones)
The game is divided into Tiers. To complete a Tier, the player must feed the **Sink** (Space Elevator) with specific items at a specific **Rate**.

**Example Milestone 1:**
*   Target: **60 Iron Ingots / minute**.
*   Condition: Maintain this rate into a Sink Node.

**Example Milestone 2:**
*   Target: **20 Iron Plates / minute**.
*   Target: **10 Iron Rods / minute**.

**The Ultimate Goal (Winning):**
Construct a factory capable of sustaining **1.0 Fusion Core / minute** with >95% network efficiency.

## Architecture
*   **GraphManager**: Stores the Topology (Nodes + Connections).
*   **FlowSystem**: The "Solver" that distributes resources.
*   **ObjectiveSystem**: The "Arbiter" that checks if `SinkNode` input rates meet the current Milestone requirements.
