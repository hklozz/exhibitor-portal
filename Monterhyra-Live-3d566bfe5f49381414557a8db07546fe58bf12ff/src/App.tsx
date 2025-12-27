/*
 * Copyright © 2025 Klozz Holding AB. All rights reserved.
 * MONTERHYRA™ - Proprietary and Confidential
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useMemo, useRef, useImperativeHandle, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';
import { Edges, Text, useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { EspressoMachine, FlowerVase, CandyBowl } from './CounterItems';
import computePacklista from './packlista';
import { WallShelf, ClothingRack, SpeakerOnStand } from './WallDecorations';
import VepaPDFGenerator from './VepaPDFGenerator';
import ForexPDFGenerator from './ForexPDFGenerator';
import StoragePDFGenerator from './StoragePDFGenerator';
import type { StorageWallDesign } from './StoragePDFGenerator';
import CounterPDFGenerator from './CounterPDFGenerator';
import type { CounterDesign } from './CounterPDFGenerator';
import { OrderManager } from './OrderManager';
import type { CustomerInfo, OrderData } from './OrderManager';
import AdminPortal from './AdminPortal';
import AdminPortal from './AdminPortal';

// Custom Dropdown Component for visual elements
const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  renderOption, 
  style = {} 
}: {
  options: any[];
  value: any;
  onChange: (value: any) => void;
  placeholder: string;
  renderOption: (option: any) => React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value || opt.label === value || opt === value);
  
  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedOption ? renderOption(selectedOption) : placeholder}
        </div>
        <span style={{ color: '#666' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                onChange(option.value || option.label || option);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: index < options.length - 1 ? '1px solid #eee' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {renderOption(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Visuell instruktionskomponent
const InstructionCard = ({ 
  icon, 
  title, 
  description, 
  type = 'info' 
}: {
  icon: string;
  title: string;
  description: string;
  type?: 'info' | 'success' | 'warning';
}) => {
  const bgColors = {
    info: '#f8f9ff',
    success: '#f0fdf4',
    warning: '#fffbeb'
  };
  
  const borderColors = {
    info: '#e0e7ff',
    success: '#dcfce7',
    warning: '#fed7aa'
  };
  
  return (
    <div style={{
      background: bgColors[type],
      border: `1px solid ${borderColors[type]}`,
      borderRadius: '8px',
      padding: '12px',
      marginTop: '8px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px'
    }}>
      <span style={{ fontSize: '16px', lineHeight: '20px' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '16px' }}>{description}</div>
      </div>
    </div>
  );
};

const DESK_SIZES = [
  { label: '1m', width: 1 },
  { label: '2m', width: 2 },
  { label: '3m', width: 3 }
];

const COUNTER_TYPES = [
  { label: 'Ingen disk', width: 0, depth: 0, image: '/Models/counters/none.svg' },
  { label: '1m disk', width: 1, depth: 0.5, image: '/Models/counters/1m.svg' },
  { label: '1,5m disk', width: 1.5, depth: 0.5, image: '/Models/counters/1-5m.svg' },
  { label: '2m disk', width: 2, depth: 0.5, image: '/Models/counters/2m.svg' },
  { label: '2,5m disk', width: 2.5, depth: 0.5, image: '/Models/counters/2-5m.svg' },
  { label: '3m disk', width: 3, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '3,5m disk', width: 3.5, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '4m disk', width: 4, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: 'L-disk (1,5m + 1m)', width: 0, depth: 0, type: 'L', image: '/Models/walls/l-shape.svg' },
  { label: 'L-disk spegelvänd (1,5m + 1m)', width: 0, depth: 0, type: 'L-mirrored', image: '/Models/walls/l-shape.svg' }
];

const TV_SIZES = [
  { label: 'Ingen', width: 0, height: 0, image: '/Models/tvs/none.svg' },
  { label: '32"', width: 0.71, height: 0.40, image: '/Models/tvs/32inch.svg' },
  { label: '43"', width: 0.96, height: 0.56, image: '/Models/tvs/43inch.svg' },
  { label: '55"', width: 1.22, height: 0.71, image: '/Models/tvs/55inch.svg' },
  { label: '70"', width: 1.55, height: 0.90, image: '/Models/tvs/70inch.svg' },
  { label: '75" beTV', width: 1.68, height: 0.95, image: '/Models/tvs/75inch.svg' }
];

const TRUSS_TYPES = [
  { label: 'Ingen truss', type: 'none', image: null },
  { label: 'Framkant truss (rak)', type: 'front-straight', width: 0.3, height: 0.3, image: '/Models/truss/front-straight.svg' },
  { label: 'Rund hängande truss', type: 'hanging-round', diameter: 2.0, height: 0.25, image: '/Models/truss/hanging-round.svg' },
  { label: 'Fyrkantig hängande truss', type: 'hanging-square', width: 2.0, depth: 2.0, height: 0.3, image: '/Models/truss/hanging-square.svg' }
] as const;

const STORAGE_TYPES = [
  { label: 'Inget förråd', width: 0, depth: 0, image: null },
  { label: '1x1m förråd', width: 1, depth: 1, image: null },
  { label: '2x1m förråd', width: 2, depth: 1, image: null },
  { label: '3x1m förråd', width: 3, depth: 1, image: null },
  { label: '4x1m förråd', width: 4, depth: 1, image: null }
];

const PLANT_TYPES = [
  { label: 'Ficus', width: 0.4, depth: 0.4, height: 1.8, color: '#228B22', leafColor: '#32CD32', type: 'tree', emoji: '🌿', image: '/Models/plants/Ficus.png' },
  { label: 'Monstera', width: 0.6, depth: 0.6, height: 1.2, color: '#2F4F2F', leafColor: '#228B22', type: 'broad', emoji: '🍃', image: '/Models/plants/monstera.svg' },
  { label: 'Bambu', width: 0.3, depth: 0.3, height: 2.0, color: '#556B2F', leafColor: '#9ACD32', type: 'bamboo', emoji: '🎋', image: '/Models/plants/bambu.svg' },
  { label: 'Palmlilja', width: 0.5, depth: 0.5, height: 1.5, color: '#8FBC8F', leafColor: '#90EE90', type: 'palm', emoji: '🌴', image: '/Models/plants/palmlilja.svg' },
  { label: 'Olivträd', width: 0.7, depth: 0.7, height: 1.6, color: '#8B7355', leafColor: '#6B8E23', type: 'tree', emoji: '🫒', image: '/Models/plants/Olivträd.png' },
  { label: 'Sansevieria', width: 0.3, depth: 0.3, height: 1.0, color: '#2F4F2F', leafColor: '#228B22', type: 'spiky', emoji: '🌱', image: '/Models/plants/sansevieria.svg' },
  { label: 'Kaktus', width: 0.2, depth: 0.2, height: 0.8, color: '#228B22', leafColor: '#32CD32', type: 'cactus', emoji: '🌵', image: '/Models/plants/kaktus.svg' },
  { label: 'Rosmarin', width: 0.4, depth: 0.4, height: 0.6, color: '#556B2F', leafColor: '#9ACD32', type: 'herb', emoji: '🌿', image: '/Models/plants/rosmarin.svg' },
  { label: 'Lavendel', width: 0.5, depth: 0.5, height: 0.7, color: '#663399', leafColor: '#DDA0DD', type: 'flower', emoji: '💜', image: '/Models/plants/lavendel.svg' },
  { label: 'Eucalyptus', width: 0.8, depth: 0.8, height: 2.2, color: '#8FBC8F', leafColor: '#98FB98', type: 'tree', emoji: '🌳', image: '/Models/plants/dracaena.png' }
];

// MONTERMALLAR FÖR MÄSSHALLEN
const EXHIBITION_BOOTH_TEMPLATES = [
  {
    id: 'empty',
    name: 'Tom montör',
    emoji: '⬜',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: '',
    wallHeight: 2.4,
    carpet: 0,
    counters: [],
    furniture: [],
    plants: [],
    storages: [],
    wallShelves: []
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    emoji: '💻',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: 'l',
    wallHeight: 2.4,
    carpet: 1, // Första färgmattan
    counters: [
      { id: 1, type: '2m disk', position: { x: 0.8, z: -0.8 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'barbord', position: { x: -0.5, z: 0.5 }, rotation: 0 }
    ],
    plants: [
      { id: 1, type: 'Monstera', position: { x: 1.0, z: 1.0 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'fashion-brand',
    name: 'Fashion Brand',
    emoji: '👗',
    floorSize: { width: 4, depth: 4 },
    floor: '4x4',
    wallShape: 'u',
    wallHeight: 2.4,
    carpet: 3, // EXPO färg
    counters: [
      { id: 1, type: '1,5m disk', position: { x: 1.2, z: -1.2 }, rotation: 45 }
    ],
    furniture: [
      { id: 1, type: 'soffa', position: { x: -1.0, z: 0 }, rotation: 90 },
      { id: 2, type: 'fatolj', position: { x: 0, z: 1.0 }, rotation: 180 }
    ],
    plants: [
      { id: 1, type: 'Ficus', position: { x: 1.5, z: 1.5 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'food-company',
    name: 'Food Company',
    emoji: '🍕',
    floorSize: { width: 6, depth: 3 },
    floor: '3x1-5',
    wallShape: 'straight',
    wallHeight: 2.4,
    carpet: 2, // Annan färgmatta
    counters: [
      { id: 1, type: '3m disk', position: { x: 0, z: -1.0 }, rotation: 0 },
      { id: 2, type: '2m disk', position: { x: 2.0, z: 0 }, rotation: 90 }
    ],
    furniture: [
      { id: 1, type: 'barbord', position: { x: -1.5, z: 0 }, rotation: 0 },
      { id: 2, type: 'barstol', position: { x: -1.2, z: 0.3 }, rotation: 0 },
      { id: 3, type: 'barstol', position: { x: -1.2, z: -0.3 }, rotation: 0 }
    ],
    plants: [],
    storages: [],
    wallShelves: []
  },
  {
    id: 'wellness-spa',
    name: 'Wellness & Spa',
    emoji: '🧘',
    floorSize: { width: 4, depth: 4 },
    floor: '4x4',
    wallShape: 'l',
    wallHeight: 2.4,
    carpet: 4, // SALSA färg
    counters: [
      { id: 1, type: '1m disk', position: { x: 1.0, z: -1.0 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'soffa', position: { x: 0, z: 0.5 }, rotation: 0 },
      { id: 2, type: 'sidobord', position: { x: -0.8, z: 0.8 }, rotation: 0 }
    ],
    plants: [
      { id: 1, type: 'Palmlilja', position: { x: 1.5, z: 1.5 } },
      { id: 2, type: 'Bambu', position: { x: -1.2, z: 1.2 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'minimal-design',
    name: 'Minimal Design',
    emoji: '⚪',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: 'straight',
    wallHeight: 2.4,
    carpet: 0, // Ingen matta
    counters: [
      { id: 1, type: 'L-disk (1,5m + 1m)', position: { x: 0.5, z: -0.5 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'fatolj', position: { x: -0.8, z: 0.8 }, rotation: 135 }
    ],
    plants: [
      { id: 1, type: 'Monstera', position: { x: 1.2, z: 1.2 } }
    ],
    storages: [],
    wallShelves: []
  }
];

// Exhibition booth interfaces
interface ExhibitionBoothTemplate {
  id: string;
  name: string;
  emoji?: string;
  floor: string;
  floorSize?: { width: number; depth: number };
  wallShape?: string;
  wallHeight?: number;
  walls?: {
    type: 'straight' | 'l-shape' | 'u-shape';
  };
  carpet?: string | number;
  counters?: Array<{
    id: number;
    type: '1m' | '1-5m' | '2m' | '2-5m' | '3m' | string;
    position: { x: number; z: number };
    rotation?: number;
  }>;
  furniture?: Array<{
    id: number;
    type: 'fatolj' | 'soffa' | 'barbord' | 'barstol' | 'sidobord' | 'pall' | string;
    position: { x: number; z: number };
    rotation?: number;
  }>;
  plants?: Array<{
    id: number;
    type: 'Monstera' | 'Ficus' | 'Olivträd' | 'kaktus' | string;
    position: { x: number; z: number };
  }>;
  storages: any[];
  wallShelves: any[];
}

// Exhibition booth renderer function
const ExhibitionBoothRenderer: React.FC<{ 
  booth: ExhibitionBoothTemplate, 
  position: { x: number, z: number },
  selectedTrussType: number,
  floorIndex: number | null,
  customFloorWidth: number,
  customFloorDepth: number
}> = ({ booth, position, selectedTrussType: _selectedTrussType, floorIndex, customFloorWidth, customFloorDepth }) => {
  if (!booth) return null;

  const floorSizeMap: { [key: string]: { width: number, length: number } } = {
    '3x3': { width: 3, length: 3 },
    '4x4': { width: 4, length: 4 },
    '3x1-5': { width: 3, length: 1.5 }
  };

  const floorSize = floorSizeMap[booth.floor] || { width: 3, length: 3 };

  // @ts-ignore - Unused variable kept for reference
  const _floorDimensions = (() => {
    if (floorIndex === null) return { width: 3, depth: 3 };
    const floorConfig = FLOOR_SIZES[floorIndex];
    if (floorConfig?.custom) {
      return { width: customFloorWidth, depth: customFloorDepth };
    }
    return { width: floorConfig.width, depth: floorConfig.depth };
  })();

  return (
    <group position={[position.x, 0, position.z]}>
      {/* ENKEL BOOTH SPOTLIGHT - Lagom intensitet */}
      <spotLight
        position={[0, 6, 0]}
        target-position={[0, 0, 0]}
        intensity={50}
        angle={Math.PI / 3}
        penumbra={0.5}
        distance={12}
        color="#ffffff"
      />
      
      {/* Premiumgolv - Glossy finish */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorSize.width, floorSize.length]} />
        <meshPhysicalMaterial 
          color="#2a2a2a" 
          roughness={0.1}
          metalness={0.8}
          clearcoat={1.0}
          reflectivity={0.9}
        />
      </mesh>

      {/* Lyxmatta med textur */}
      {booth.carpet && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[floorSize.width * 0.8, floorSize.length * 0.8]} />
          <meshPhysicalMaterial 
            color={booth.carpet} 
            roughness={0.9}
            normalScale={[0.5, 0.5]}
          />
        </mesh>
      )}

      {/* PROFESSIONELLA VÄGGAR med tjocklek och hyrgrafik */}
      {booth.wallShape === 'straight' && (
        <group>
          {/* Huvudvägg */}
          <mesh position={[0, 1.25, -floorSize.length/2]} castShadow receiveShadow>
            <boxGeometry args={[floorSize.width, 2.5, 0.15]} />
            <meshPhysicalMaterial 
              color="#f8f9fa" 
              roughness={0.3}
              metalness={0.1}
              clearcoat={0.3}
            />
          </mesh>
          
          {/* HYRGRAFIK på bakvägg */}
          <mesh position={[0, 1.3, -floorSize.length/2 + 0.08]} rotation={[0, 0, 0]}>
            <planeGeometry args={[floorSize.width * 0.8, 1.8]} />
            <meshPhysicalMaterial 
              color="#1e40af"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          {/* Monterhyra logotype på grafik */}
          <mesh position={[0, 1.8, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[1.5, 0.3]} />
            <meshPhysicalMaterial 
              color="#ffffff"
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Dekorativa element */}
          <mesh position={[-floorSize.width * 0.25, 0.8, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshPhysicalMaterial 
              color="#3b82f6"
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[floorSize.width * 0.25, 0.8, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshPhysicalMaterial 
              color="#3b82f6"
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
          
          {/* Väggkant - metallisk finish */}
          <mesh position={[0, 2.52, -floorSize.length/2]}>
            <boxGeometry args={[floorSize.width, 0.04, 0.16]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {booth.wallShape === 'l' && (
        <group>
          {/* Bakvägg */}
          <mesh position={[0, 1.25, -floorSize.length/2]} castShadow receiveShadow>
            <boxGeometry args={[floorSize.width, 2.5, 0.15]} />
            <meshPhysicalMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} clearcoat={0.3} />
          </mesh>
          
          {/* HYRGRAFIK på bakvägg */}
          <mesh position={[0, 1.3, -floorSize.length/2 + 0.08]}>
            <planeGeometry args={[floorSize.width * 0.7, 1.6]} />
            <meshPhysicalMaterial 
              color="#dc2626"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          {/* Monterhyra logotype */}
          <mesh position={[0, 1.7, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[1.2, 0.25]} />
            <meshPhysicalMaterial 
              color="#ffffff"
            />
          </mesh>
          
          <mesh position={[0, 2.52, -floorSize.length/2]}>
            <boxGeometry args={[floorSize.width, 0.04, 0.16]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Sidovägg */}
          <mesh position={[-floorSize.width/2, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 2.5, floorSize.length]} />
            <meshPhysicalMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} clearcoat={0.3} />
          </mesh>
          
          {/* HYRGRAFIK på sidovägg */}
          <mesh position={[-floorSize.width/2 + 0.08, 1.2, 0]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[floorSize.length * 0.6, 1.4]} />
            <meshPhysicalMaterial 
              color="#dc2626"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          <mesh position={[-floorSize.width/2, 2.52, 0]}>
            <boxGeometry args={[0.16, 0.04, floorSize.length]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {booth.wallShape === 'u' && (
        <group>
          {/* Bakvägg */}
          <mesh position={[0, 1.25, -floorSize.length/2]} castShadow receiveShadow>
            <boxGeometry args={[floorSize.width, 2.5, 0.15]} />
            <meshPhysicalMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} clearcoat={0.3} />
          </mesh>
          
          {/* STOR HYRGRAFIK på bakvägg */}
          <mesh position={[0, 1.4, -floorSize.length/2 + 0.08]}>
            <planeGeometry args={[floorSize.width * 0.9, 2.0]} />
            <meshPhysicalMaterial 
              color="#10b981"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          {/* Stor Monterhyra logotype */}
          <mesh position={[0, 2.0, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[2.0, 0.4]} />
            <meshPhysicalMaterial 
              color="#ffffff"
            />
          </mesh>
          
          {/* Premium dekor element */}
          <mesh position={[0, 0.8, -floorSize.length/2 + 0.085]}>
            <planeGeometry args={[1.5, 0.8]} />
            <meshPhysicalMaterial 
              color="#34d399"
              roughness={0.0}
              metalness={0.4}
            />
          </mesh>
          
          <mesh position={[0, 2.52, -floorSize.length/2]}>
            <boxGeometry args={[floorSize.width, 0.04, 0.16]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Vänster sidovägg */}
          <mesh position={[-floorSize.width/2, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 2.5, floorSize.length]} />
            <meshPhysicalMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} clearcoat={0.3} />
          </mesh>
          
          {/* HYRGRAFIK på vänster sidovägg */}
          <mesh position={[-floorSize.width/2 + 0.08, 1.3, 0]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[floorSize.length * 0.8, 1.6]} />
            <meshPhysicalMaterial 
              color="#10b981"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          <mesh position={[-floorSize.width/2, 2.52, 0]}>
            <boxGeometry args={[0.16, 0.04, floorSize.length]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Höger sidovägg */}
          <mesh position={[floorSize.width/2, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 2.5, floorSize.length]} />
            <meshPhysicalMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} clearcoat={0.3} />
          </mesh>
          
          {/* HYRGRAFIK på höger sidovägg */}
          <mesh position={[floorSize.width/2 - 0.08, 1.3, 0]} rotation={[0, -Math.PI/2, 0]}>
            <planeGeometry args={[floorSize.length * 0.8, 1.6]} />
            <meshPhysicalMaterial 
              color="#10b981"
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
          
          <mesh position={[floorSize.width/2, 2.52, 0]}>
            <boxGeometry args={[0.16, 0.04, floorSize.length]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* PREMIUM DISKAR med realistiska material */}
      {booth.counters?.map((counter, index: number) => {
        const COUNTER_MATERIALS: Record<string, { base: string; metal: string }> = {
          '1m': { base: '#1a2332', metal: '#4a5568' },
          '1-5m': { base: '#2d3748', metal: '#718096' }, 
          '2m': { base: '#1a2332', metal: '#4a5568' },
          '2-5m': { base: '#2d3748', metal: '#718096' },
          '3m': { base: '#1a2332', metal: '#4a5568' }
        };
        
        const COUNTER_DIMENSIONS: Record<string, { width: number; length: number; height: number }> = {
          '1m': { width: 1, length: 0.6, height: 1 },
          '1-5m': { width: 1.5, length: 0.6, height: 1 },
          '2m': { width: 2, length: 0.6, height: 1 },
          '2-5m': { width: 2.5, length: 0.6, height: 1 },
          '3m': { width: 3, length: 0.6, height: 1 }
        };

        const dimensions = COUNTER_DIMENSIONS[counter.type] || { width: 1, length: 0.6, height: 1 };
        const materials = COUNTER_MATERIALS[counter.type] || { base: '#1a2332', metal: '#4a5568' };
        
        return (
          <group 
            key={index}
            position={[counter.position.x, 0, counter.position.z]}
            rotation={[0, (counter.rotation || 0) * Math.PI / 180, 0]}
          >
            {/* Disk bas */}
            <mesh position={[0, dimensions.height/2, 0]} castShadow receiveShadow>
              <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
              <meshPhysicalMaterial 
                color={materials.base} 
                roughness={0.2}
                metalness={0.8}
                clearcoat={0.5}
              />
            </mesh>
            {/* Disk topp - Glossy finish */}
            <mesh position={[0, dimensions.height + 0.02, 0]}>
              <boxGeometry args={[dimensions.width, 0.04, dimensions.length]} />
              <meshPhysicalMaterial 
                color={materials.metal} 
                roughness={0.05}
                metalness={0.95}
                clearcoat={1.0}
              />
            </mesh>
          </group>
        );
      })}

      {/* REALISTISKA MÖBLER med olika typer */}
      {booth.furniture?.map((furniture, index: number) => {
        const furnitureConfig: Record<string, { 
          color: string; 
          size: number[]; 
          metalness: number; 
          roughness: number; 
        }> = {
          'fatolj': { 
            color: '#8B4513', 
            size: [0.8, 0.7, 0.8],
            metalness: 0.1,
            roughness: 0.8
          },
          'soffa': { 
            color: '#654321', 
            size: [1.6, 0.7, 0.8],
            metalness: 0.1,
            roughness: 0.8
          },
          'barbord': { 
            color: '#2c3e50', 
            size: [0.6, 1.1, 0.6],
            metalness: 0.7,
            roughness: 0.2
          },
          'barstol': { 
            color: '#34495e', 
            size: [0.4, 1.0, 0.4],
            metalness: 0.6,
            roughness: 0.3
          },
          'sidobord': { 
            color: '#8B4513', 
            size: [0.5, 0.5, 0.5],
            metalness: 0.2,
            roughness: 0.7
          },
          'pall': { 
            color: '#A0522D', 
            size: [0.4, 0.45, 0.4],
            metalness: 0.1,
            roughness: 0.9
          }
        };

        const config = furnitureConfig[furniture.type] || furnitureConfig['fatolj'];
        
        return (
          <mesh 
            key={index}
            position={[furniture.position.x, config.size[1]/2, furniture.position.z]}
            rotation={[0, (furniture.rotation || 0) * Math.PI / 180, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={config.size as [number, number, number]} />
            <meshPhysicalMaterial 
              color={config.color}
              roughness={config.roughness}
              metalness={config.metalness}
            />
          </mesh>
        );
      })}

      {/* REALISTISKA VÄXTER med olika typer */}
      {booth.plants?.map((plant, index: number) => {
        const plantConfig: Record<string, { 
          pot: string; 
          leaves: string; 
          size: number; 
          height: number; 
        }> = {
          'Monstera': { 
            pot: '#8B4513', 
            leaves: '#228B22',
            size: 0.5,
            height: 1.2
          },
          'Ficus': { 
            pot: '#654321', 
            leaves: '#2F4F2F',
            size: 0.4,
            height: 1.0
          },
          'Olivträd': { 
            pot: '#8B7355', 
            leaves: '#556B2F',
            size: 0.3,
            height: 0.8
          },
          'kaktus': { 
            pot: '#CD853F', 
            leaves: '#228B22',
            size: 0.15,
            height: 0.4
          }
        };

        const config = plantConfig[plant.type] || plantConfig['Monstera'];
        
        return (
          <group key={index} position={[plant.position.x, 0, plant.position.z]}>
            {/* Lyxkruka med textur */}
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.15, 0.2, 0.3, 12]} />
              <meshPhysicalMaterial 
                color={config.pot}
                roughness={0.6}
                metalness={0.1}
                normalScale={[0.3, 0.3]}
              />
            </mesh>
            
            {/* Realistisk växt med flera former */}
            <group position={[0, 0.4, 0]}>
              {/* Huvudstam/löv */}
              <mesh position={[0, config.height/2, 0]} castShadow>
                <sphereGeometry args={[config.size, 12, 8]} />
                <meshLambertMaterial color={config.leaves} />
              </mesh>
              
              {/* Extra löv för större växter */}
              {config.size > 0.3 && (
                <>
                  <mesh position={[-0.2, config.height * 0.7, 0.1]} castShadow>
                    <sphereGeometry args={[config.size * 0.6, 8, 6]} />
                    <meshLambertMaterial color={config.leaves} />
                  </mesh>
                  <mesh position={[0.15, config.height * 0.8, -0.15]} castShadow>
                    <sphereGeometry args={[config.size * 0.5, 8, 6]} />
                    <meshLambertMaterial color={config.leaves} />
                  </mesh>
                </>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
};

// Helper component: exposes a captureViews() method via ref that renders three camera positions
// into an offscreen render target and returns data URLs for each view.
const CaptureHelper = React.forwardRef<any, {onHideGrid?: (hide: boolean) => void}>((props, ref) => {
  // lazy require inside component to avoid SSR issues
  const { gl, scene, camera } = useThree();
  const originalCamera = camera as any;

  useImperativeHandle(ref, () => ({
    captureViews: (width = 800, height = 533) => { // Minskad från 1200x800 till 800x533 (33% mindre)
      // Dölja grid temporärt
      if (props.onHideGrid) props.onHideGrid(true);
      
      // create a temporary render target with antialiasing
      const target = new THREE.WebGLRenderTarget(width, height, {
        samples: 2, // Minskad antialiasing från 4 till 2
        colorSpace: THREE.SRGBColorSpace
      });
      const prevRenderTarget = gl.getRenderTarget();
      const prevAspect = originalCamera.aspect;
      const prevBackground = scene.background;
      const results: string[] = [];

      // Temporärt sätt en ren bakgrund för PDF-bilderna
      scene.background = new THREE.Color(0xf8f9fa);

      // Förbättrade kamerapositioner för bättre vyer av montern
      const snapshots = [
        { pos: [0, 8, 0], lookAt: [0, 0, 0], name: 'ovanifrån' }, // direkt ovanifrån
        { pos: [-4, 3, 4], lookAt: [0, 1, 0], name: 'perspektiv' }, // bättre vinkel från sidan
        { pos: [6, 4, 6], lookAt: [0, 1, 0], name: 'helvy' } // från andra sidan
      ];

      const tmpCam = originalCamera.clone();
      tmpCam.aspect = width / height;

      for (const s of snapshots) {
        tmpCam.position.set(...s.pos as [number, number, number]);
        tmpCam.lookAt(new THREE.Vector3(...(s.lookAt as [number, number, number])));
        tmpCam.updateProjectionMatrix();
        
        gl.setSize(width, height);
        gl.setRenderTarget(target);
        gl.setClearColor(0xf8f9fa, 1); // ljus grå bakgrund
        gl.clear();
        gl.render(scene, tmpCam);
        
        const pixels = new Uint8Array(width * height * 4);
        gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);
        
        // create canvas and copy pixels
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
        
        // flip Y because readRenderTargetPixels gives bottom-up
        const flippedCanvas = document.createElement('canvas');
        flippedCanvas.width = width;
        flippedCanvas.height = height;
        const flippedCtx = flippedCanvas.getContext('2d')!;
        flippedCtx.scale(1, -1);
        flippedCtx.drawImage(canvas, 0, -height);
        
        // Använd JPEG med 70% kvalitet istället för PNG för mycket mindre filstorlek
        results.push(flippedCanvas.toDataURL('image/jpeg', 0.7));
      }

      // restore original settings
      gl.setRenderTarget(prevRenderTarget);
      originalCamera.aspect = prevAspect;
      originalCamera.updateProjectionMatrix();
      scene.background = prevBackground;
      target.dispose();
      
      // Visa grid igen
      if (props.onHideGrid) props.onHideGrid(false);

      return results;
    }
  }));

  return null;
});


const FURNITURE_TYPES = [
  { label: 'Barbord', width: 0.6, depth: 0.6, height: 1.1, color: '#FFFFFF', type: 'table', emoji: '🍸', image: '/Models/furniture/barbord.svg' },
  { label: 'Barstol', width: 0.4, depth: 0.4, height: 1.0, color: '#FFFFFF', type: 'chair', emoji: '🪑', image: '/Models/furniture/barstol.svg' },
  { label: 'Pall', width: 0.35, depth: 0.35, height: 0.45, color: '#4169E1', type: 'stool', emoji: '🛋️', image: '/Models/furniture/pall.svg' },
  { label: 'Soffa 2-sits', width: 1.4, depth: 0.8, height: 0.85, color: '#2F4F4F', type: 'sofa', emoji: '🛋️', image: '/Models/furniture/soffa.svg' },
  { label: 'Soffa 3-sits', width: 1.8, depth: 0.8, height: 0.85, color: '#2F4F4F', type: 'sofa', emoji: '🛋️', image: '/Models/furniture/soffa.svg' },
  { label: 'Fåtölj', width: 0.8, depth: 0.8, height: 0.9, color: '#8B4513', type: 'armchair', emoji: '🪑', image: '/Models/furniture/fatolj.svg' },
  { label: 'Sidobord', width: 0.5, depth: 0.5, height: 0.5, color: '#DEB887', type: 'side_table', emoji: '🪑', image: '/Models/furniture/sidobord.svg' },
  { label: 'Podie (Vitlaserad furu)', width: 0.35, depth: 0.2, height: 0.9, color: '#F8F8F0', type: 'podium', emoji: '📦', image: null }
];

const FLOOR_SIZES = [
  { label: '3x1,5', width: 3, depth: 1.5, image: '/Models/floors/3x1-5.svg' },
  { label: '3x2', width: 3, depth: 2, image: '/Models/floors/floor.svg' },
  { label: '3x3', width: 3, depth: 3, image: '/Models/floors/3x3.svg' },
  { label: '4x2', width: 4, depth: 2, image: '/Models/floors/floor.svg' },
  { label: '4x3', width: 4, depth: 3, image: '/Models/floors/floor.svg' },
  { label: '4x4', width: 4, depth: 4, image: '/Models/floors/4x4.svg' },
  { label: '5x2', width: 5, depth: 2, image: '/Models/floors/floor.svg' },
  { label: '5x3', width: 5, depth: 3, image: '/Models/floors/floor.svg' },
  { label: '5x5', width: 5, depth: 5, image: '/Models/floors/floor.svg' },
  { label: '6x3', width: 6, depth: 3, image: '/Models/floors/floor.svg' },
  { label: '6x4', width: 6, depth: 4, image: '/Models/floors/floor.svg' },
  { label: '6x5', width: 6, depth: 5, image: '/Models/floors/floor.svg' },
  { label: '6x6', width: 6, depth: 6, image: '/Models/floors/floor.svg' },
  { label: '7x3', width: 7, depth: 3, image: '/Models/floors/floor.svg' },
  { label: '7x4', width: 7, depth: 4, image: '/Models/floors/floor.svg' },
  { label: '7x7', width: 7, depth: 7, image: '/Models/floors/floor.svg' },
  { label: '8x3', width: 8, depth: 3, image: '/Models/floors/floor.svg' },
  { label: '8x5', width: 8, depth: 5, image: '/Models/floors/floor.svg' },
  { label: '8x6', width: 8, depth: 6, image: '/Models/floors/floor.svg' },
  { label: '10x10', width: 10, depth: 10, image: '/Models/floors/floor.svg' },
  { label: 'Anpassad storlek', width: 0, depth: 0, custom: true, image: null }
];

const CARPET_COLORS = [
  { name: 'Ingen matta', color: null },
  // EXPO färger (180 kr/kvm)
  { name: 'EXPO - Röd', color: '#e74c3c' },
  { name: 'EXPO - Blå', color: '#3498db' },
  { name: 'EXPO - Grön', color: '#27ae60' },
  { name: 'EXPO - Gul', color: '#f1c40f' },
  { name: 'EXPO - Orange', color: '#e67e22' },
  { name: 'EXPO - Lila', color: '#9b59b6' },
  { name: 'EXPO - Rosa', color: '#e91e63' },
  { name: 'EXPO - Turkos', color: '#1abc9c' },
  { name: 'EXPO - Lime', color: '#8bc34a' },
  { name: 'EXPO - Magenta', color: '#e91e63' },
  // SALSA färger (240 kr/kvm = 180 + 60)
  { name: 'SALSA - Djup Röd', color: '#8b0000' },
  { name: 'SALSA - Marinblå', color: '#000080' },
  { name: 'SALSA - Smaragdgrön', color: '#006400' },
  { name: 'SALSA - Burgundy', color: '#800020' },
  { name: 'SALSA - Midnattsblå', color: '#191970' },
  { name: 'SALSA - Skogsgrön', color: '#228b22' },
  { name: 'SALSA - Körsbärsröd', color: '#de3163' },
  { name: 'SALSA - Safirblå', color: '#0f52ba' },
  // Rutmönster sist (255 kr/kvm)
  { name: 'Rutmönster Svart/Vit', color: 'checkerboard-bw' },
  { name: 'Rutmönster Röd/Svart', color: 'checkerboard-rb' },
  { name: 'Rutmönster Blå/Vit', color: 'checkerboard-bwhite' },
  { name: 'Rutmönster Gul/Svart', color: 'checkerboard-yb' }
];

const WALL_SHAPES = [
  { label: 'Inget valt', value: '', image: null },
  { label: 'Rak', value: 'straight', image: '/Models/walls/straight.svg' },
  { label: 'L-form', value: 'l', image: '/Models/walls/l-shape.svg' },
  { label: 'U-form', value: 'u', image: '/Models/walls/u-shape.svg' }
];

const WALL_HEIGHTS = [
  { label: '2,5 m', value: 2.5, image: null },
  { label: '3 m', value: 3, image: null },
  { label: '3,5 m', value: 3.5, image: null }
];

const GRAPHICS = [
  { label: 'Ej valt', value: 'none', image: null },
  { label: 'Hyr grafik', value: 'hyr', image: null },
  { label: 'Eget tryck (forex)', value: 'forex', image: null },
  { label: 'Eget tryck (vepa)', value: 'vepa', image: null }
];




function Floor({ 
  width, 
  depth, 
  onFloorClick 
}: { 
  width: number; 
  depth: number; 
  onFloorClick?: (x: number, z: number) => void;
}) {
  const tiles = [];
  const tileSize = 1; // basstorlek 1 meter

  // Räkna antal plattor i varje riktning och hantera partialplattor i kanten
  const xCount = Math.ceil(width / tileSize);
  const zCount = Math.ceil(depth / tileSize);
  const remWidth = width - Math.floor(width);
  const remDepth = depth - Math.floor(depth);

  // Kumulativ pos för att centrera exakt totala bredden/depth
  let cumX = 0;
  for (let ix = 0; ix < xCount; ix++) {
    const thisTileWidth = (ix === xCount - 1 && remWidth > 0) ? remWidth : tileSize;
    let cumZ = 0;
    for (let iz = 0; iz < zCount; iz++) {
      const thisTileDepth = (iz === zCount - 1 && remDepth > 0) ? remDepth : tileSize;

      // Positionera plattan relativt till total width/depth så allt centrerar korrekt
      const posX = -width / 2 + cumX + thisTileWidth / 2;
      const posZ = -depth / 2 + cumZ + thisTileDepth / 2;

      tiles.push(
        <mesh
          key={`${ix}-${iz}`}
          position={[posX, 0, posZ]}
          receiveShadow
          onClick={(e) => {
            if (onFloorClick) {
              e.stopPropagation();
              onFloorClick(posX, posZ);
            }
          }}
        >
          <boxGeometry args={[thisTileWidth, 0.12, thisTileDepth]} />
          <meshPhysicalMaterial color={"#fff"} roughness={0.9} metalness={0.1} />
          <Edges color="#ccc" />
        </mesh>
      );

      cumZ += thisTileDepth;
    }
    cumX += thisTileWidth;
  }
  
  return <>{tiles}</>;
}

function Carpet({ width, depth, color }: { width: number, depth: number, color: string }) {
  // Mattan ligger precis ovanpå golvet, centrerad
  
  // Hantera rutmönster
  if (color.startsWith('checkerboard-')) {
    let color1, color2;
    switch (color) {
      case 'checkerboard-bw':
        color1 = '#000000'; // Svart
        color2 = '#ffffff'; // Vit
        break;
      case 'checkerboard-rb':
        color1 = '#ff0000'; // Röd
        color2 = '#000000'; // Svart
        break;
      case 'checkerboard-bwhite':
        color1 = '#0000ff'; // Blå
        color2 = '#ffffff'; // Vit
        break;
      case 'checkerboard-yb':
        color1 = '#ffff00'; // Gul
        color2 = '#000000'; // Svart
        break;
      default:
        color1 = '#000000';
        color2 = '#ffffff';
    }

    // Skapa rutmönster-textur med 0.5m rutor och centrera/aligna mot halvmeter-grid
    const checkerTexture = (() => {
      const canvas = document.createElement('canvas');
      const size = 256; // Bra upplösning
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Vi ritar en enkel 2x2-enhet som representerar 1 ruta på 0.5m
      const squareSizePx = size / 2;
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
          ctx.fillRect(x * squareSizePx, y * squareSizePx, squareSizePx, squareSizePx);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // Ruta i verkligheten är 0.5m
      const squareSizeMeters = 0.5;
      // Antal rutor i varje riktning
      const repeatX = width / squareSizeMeters;
      const repeatZ = depth / squareSizeMeters;

      texture.repeat.set(repeatX, repeatZ);

      // Offset så mönstret centrerar mot mitten och alignar med 0.5m grid
      // Beräkna hur mycket av en ruta som är överhäng (remainder)
      const remX = (repeatX - Math.floor(repeatX)) / 2;
      const remZ = (repeatZ - Math.floor(repeatZ)) / 2;
      texture.offset.set(remX, remZ);

      return texture;
    })();

    return (
      <mesh position={[0, 0.065, 0]}>
        <boxGeometry args={[width, 0.01, depth]} />
        <meshStandardMaterial map={checkerTexture} />
      </mesh>
    );
  }

  // Vanlig enfärgad matta
  return (
    <mesh position={[0, 0.065, 0]}>
      <boxGeometry args={[width, 0.01, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// VEPA Wall component - renderar design från VepaPDFGenerator
// Hook för att skapa VEPA texture från design
// @ts-ignore - Unused function kept for future use
function _useVepaTexture(design: any) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!design) return;

    const canvas = document.createElement('canvas');
    const mmToPixels = 2;
    canvas.width = design.widthMM * mmToPixels;
    canvas.height = design.heightMM * mmToPixels;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Rita bakgrundsfärg
    ctx.fillStyle = design.backgroundColorRGB || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const updateTexture = () => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
      setTexture(tex);
    };

    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx!.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        if (design.logo) {
          const logoImg = new Image();
          logoImg.onload = () => {
            ctx!.drawImage(
              logoImg,
              design.logo.x * mmToPixels,
              design.logo.y * mmToPixels,
              design.logo.width * mmToPixels,
              design.logo.height * mmToPixels
            );
            updateTexture();
          };
          logoImg.onerror = updateTexture;
          logoImg.src = design.logo.imageData;
        } else {
          updateTexture();
        }
      };
      bgImg.onerror = () => {
        if (design.logo) {
          const logoImg = new Image();
          logoImg.onload = () => {
            ctx!.drawImage(
              logoImg,
              design.logo.x * mmToPixels,
              design.logo.y * mmToPixels,
              design.logo.width * mmToPixels,
              design.logo.height * mmToPixels
            );
            updateTexture();
          };
          logoImg.onerror = updateTexture;
          logoImg.src = design.logo.imageData;
        } else {
          updateTexture();
        }
      };
      bgImg.src = design.backgroundImage;
    } else if (design.logo) {
      const logoImg = new Image();
      logoImg.onload = () => {
        ctx!.drawImage(
          logoImg,
          design.logo.x * mmToPixels,
          design.logo.y * mmToPixels,
          design.logo.width * mmToPixels,
          design.logo.height * mmToPixels
        );
        updateTexture();
      };
      logoImg.onerror = updateTexture;
      logoImg.src = design.logo.imageData;
    } else {
      updateTexture();
    }
  }, [design]);

  return texture;
}

function VepaWallOverlay({ design, wallLength, wallHeight, position, rotation }: {
  design: any,
  wallLength: number,
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  console.log('🎨 VepaWallOverlay called with design:', design);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  
  useEffect(() => {
    console.log('🔧 VepaWallOverlay useEffect running');
    
    // FAST STORLEK 512x512 som vi vet fungerar
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Could not get canvas context');
      return;
    }
    
    console.log('✅ Canvas created: 512x512');
    
    // Rita bakgrundsfärg
    ctx.fillStyle = design.backgroundColorRGB || '#FF00FF';
    ctx.fillRect(0, 0, 512, 512);
    console.log('✅ Background color drawn:', design.backgroundColorRGB);
    
    const updateTexture = () => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
      setTexture(tex);
      console.log('✅ Texture updated!');
    };
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx!.drawImage(bgImg, 0, 0, 512, 512);
        console.log('✅ Background image drawn');
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.onerror = () => {
        console.error('❌ Failed to load background image');
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.src = design.backgroundImage;
    } else if (design.logo) {
      loadLogo();
    } else {
      updateTexture();
    }
    
    function loadLogo() {
      if (!design.logo) return;
      console.log('📷 Loading logo...');
      const logoImg = new Image();
      logoImg.onload = () => {
        const scaleX = 512 / design.widthMM;
        const scaleY = 512 / design.heightMM;
        ctx!.drawImage(
          logoImg,
          design.logo.x * scaleX,
          design.logo.y * scaleY,
          design.logo.width * scaleX,
          design.logo.height * scaleY
        );
        console.log('✅ Logo drawn at', design.logo.x * scaleX, design.logo.y * scaleY);
        updateTexture();
      };
      logoImg.onerror = () => {
        console.error('❌ Failed to load logo');
        updateTexture();
      };
      logoImg.src = design.logo.imageData;
    }
  }, [design]);
  
  console.log('🖼️ VepaWallOverlay render, texture:', texture ? 'EXISTS' : 'NULL');
  console.log('📏 Wall dimensions:', wallLength, 'x', wallHeight);
  console.log('📍 Position:', position);
  
  if (!texture) return null;
  
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <planeGeometry args={[wallLength, wallHeight]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Forex Wall Overlay Component (samma som VEPA men för Forex)
function ForexWallOverlay({ design, wallLength, wallHeight, position, rotation }: {
  design: any,
  wallLength: number,
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  console.log('🖼️ ForexWallOverlay called with design:', design);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  
  useEffect(() => {
    console.log('🔧 ForexWallOverlay useEffect running');
    
    // FAST STORLEK 512x512 som vi vet fungerar
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Could not get canvas context');
      return;
    }
    
    console.log('✅ Canvas created: 512x512');
    
    // Rita bakgrundsfärg
    ctx.fillStyle = design.backgroundColorRGB || '#FF00FF';
    ctx.fillRect(0, 0, 512, 512);
    console.log('✅ Background color drawn:', design.backgroundColorRGB);
    
    const updateTexture = () => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
      setTexture(tex);
      console.log('✅ Texture updated!');
    };
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx!.drawImage(bgImg, 0, 0, 512, 512);
        console.log('✅ Background image drawn');
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.onerror = () => {
        console.error('❌ Failed to load background image');
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.src = design.backgroundImage;
    } else if (design.logo) {
      loadLogo();
    } else {
      updateTexture();
    }
    
    function loadLogo() {
      if (!design.logo) return;
      console.log('📷 Loading logo...');
      const logoImg = new Image();
      logoImg.onload = () => {
        const scaleX = 512 / design.widthMM;
        const scaleY = 512 / design.heightMM;
        ctx!.drawImage(
          logoImg,
          design.logo.x * scaleX,
          design.logo.y * scaleY,
          design.logo.width * scaleX,
          design.logo.height * scaleY
        );
        console.log('✅ Logo drawn at', design.logo.x * scaleX, design.logo.y * scaleY);
        updateTexture();
      };
      logoImg.onerror = () => {
        console.error('❌ Failed to load logo');
        updateTexture();
      };
      logoImg.src = design.logo.imageData;
    }
  }, [design]);
  
  console.log('🖼️ ForexWallOverlay render, texture:', texture ? 'EXISTS' : 'NULL');
  console.log('📏 Wall dimensions:', wallLength, 'x', wallHeight);
  console.log('📍 Position:', position);
  
  if (!texture) return null;
  
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <planeGeometry args={[wallLength, wallHeight]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Storage Wall Overlay Component - högupplöst canvas-baserad textur för förråd
function StorageWallOverlay({ imageUrl, wallWidth, wallHeight, position, rotation }: {
  imageUrl: string,
  wallWidth: number,
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  
  useEffect(() => {
    // FAST STORLEK 512x512 för optimal prestanda och kvalitet
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ StorageWallOverlay: Could not get canvas context');
      return;
    }
    
    const updateTexture = () => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    
    // Ladda och rita bilden
    const img = new Image();
    img.onload = () => {
      ctx!.drawImage(img, 0, 0, 512, 512);
      updateTexture();
    };
    img.onerror = () => {
      console.error('❌ StorageWallOverlay: Failed to load image');
      // Rita en fallback-färg
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(0, 0, 512, 512);
      updateTexture();
    };
    img.src = imageUrl;
  }, [imageUrl]);
  
  if (!texture) return null;
  
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <planeGeometry args={[wallWidth, wallHeight]} />
      <meshBasicMaterial 
        map={texture}
        transparent={true}
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Storage Wall Design Overlay - för VEPA/Forex designs från StoragePDFGenerator
function StorageWallDesignOverlay({ design, wallWidth, wallHeight, position, rotation }: {
  design: StorageWallDesign,
  wallWidth: number,
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ StorageWallDesignOverlay: Could not get canvas context');
      return;
    }
    
    // Rita bakgrundsfärg
    ctx.fillStyle = design.backgroundColorRGB || '#FFFFFF';
    ctx.fillRect(0, 0, 512, 512);
    
    const updateTexture = () => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx!.drawImage(bgImg, 0, 0, 512, 512);
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.onerror = () => {
        console.error('❌ Failed to load background image for storage design');
        if (design.logo) {
          loadLogo();
        } else {
          updateTexture();
        }
      };
      bgImg.src = design.backgroundImage;
    } else if (design.logo) {
      loadLogo();
    } else {
      updateTexture();
    }
    
    function loadLogo() {
      if (!design.logo) return;
      const logoImg = new Image();
      logoImg.onload = () => {
        const scaleX = 512 / design.widthMM;
        const scaleY = 512 / design.heightMM;
        ctx!.drawImage(
          logoImg,
          design.logo!.x * scaleX,
          design.logo!.y * scaleY,
          design.logo!.width * scaleX,
          design.logo!.height * scaleY
        );
        updateTexture();
      };
      logoImg.onerror = () => {
        console.error('❌ Failed to load logo for storage design');
        updateTexture();
      };
      logoImg.src = design.logo.imageData;
    }
  }, [design]);
  
  if (!texture) return null;
  
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <planeGeometry args={[wallWidth, wallHeight]} />
      <meshBasicMaterial 
        map={texture}
        transparent={true}
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ImageOverlay({ imageUrl, wallLength, wallHeight, position, rotation }: { 
  imageUrl: string, 
  wallLength: number, 
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  const texture = new THREE.TextureLoader().load(imageUrl);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true; // Flippa bilden rätt väg upp
  
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <planeGeometry args={[wallLength, wallHeight]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ForexImageOverlay({ imageUrl, wallLength, wallHeight, position, rotation }: { 
  imageUrl: string, 
  wallLength: number, 
  wallHeight: number,
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  const texture = new THREE.TextureLoader().load(imageUrl);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true;
  
  const lists = [];
  const numLists = Math.floor(wallLength); // Antal lister (en mindre än antal meter)
  
  // Skapa silvriga lister varje meter
  for (let i = 1; i < numLists; i++) {
    const listPos = i - wallLength/2;
    
    // Justera listernas position baserat på väggtyp
    let listPosition: [number, number, number];
    let listGeometry: [number, number, number];
    
    if (rotation && Math.abs(rotation[1]) > 0) {
      // Sidovägg - listerna ska vara i z-led (djup av montern)
      listPosition = [0, 0, listPos];
      listGeometry = [0.008, wallHeight, 0.02]; // Tunnare i x-led
    } else {
      // Bakvägg - listerna ska vara i x-led (bredd av montern)
      listPosition = [listPos, 0, 0.005];
      listGeometry = [0.02, wallHeight, 0.008]; // Tunnare i z-led
    }
    
    // Använd boxGeometry istället för planeGeometry för bättre synlighet
    lists.push(
      <mesh 
        key={`list-${i}`}
        position={listPosition} 
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={listGeometry} />
        <meshStandardMaterial 
          color="#d0d0d0" 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
    );
  }
  
  return (
    <group position={position}>
      {/* Hela bilden som bakgrund */}
      <mesh rotation={rotation || [0, 0, 0]}>
        <planeGeometry args={[wallLength, wallHeight]} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
      {/* Silvriga lister ovanpå */}
      {lists}
    </group>
  );
}

function Plant({ plantConfig, position, rotation }: { 
  plantConfig: any, 
  position: [number, number, number],
  rotation: number
}) {
  const potHeight = 0.3;
  const potRadius = plantConfig.width / 2 - 0.05;
  // Small image-based renderer for photographic plants (cutout plane)
  function PlantImage({ url, w, h }: { url: string, w: number, h: number }) {
    // useTexture handles caching
    // @ts-ignore
    const tex: any = useTexture(url);
    if (tex) {
      tex.flipY = false;
      // set encoding in a type-safe-avoiding way
      (tex as any).encoding = (THREE as any).sRGBEncoding || 3000;
    }
    return (
      <group>
        {/* Front image */}
        <mesh position={[0, h/2 + 0.02, 0]} renderOrder={1}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={tex} transparent={true} alphaTest={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Backface subtle darkening to give volume */}
        <mesh position={[0, h/2 + 0.02, -0.005]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[w*0.98, h*0.98]} />
          <meshStandardMaterial color="#0b3a0b" opacity={0.85} transparent={true} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }
      {/* SUPERREALISTISKA VÄXTER */}
      {/* If we have a photographic asset for this label, prefer that for extra realism. Place images in public/models/plants/<name>.png */}
      {(() => {
        const lbl = (plantConfig.label || '').toLowerCase();
        const mapping: Record<string,string> = {
          'drakträd': '/models/plants/dracaena.png',
          'dracaena': '/models/plants/dracaena.png',
          'ficus elastica': '/models/plants/ficus_elastica.png'
        };
        for (const key of Object.keys(mapping)) {
          if (lbl.includes(key)) {
            // scale image to approximate plantConfig dimensions
            const w = Math.max(plantConfig.width * 1.0, 0.4);
            const h = Math.max(plantConfig.height * 1.0, 0.9);
            return <PlantImage url={mapping[key]} w={w} h={h} />;
          }
        }
        return null;
      })()}
  
  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {/* Kruka */}
      <mesh position={[0, potHeight/2, 0]}>
        <cylinderGeometry args={[potRadius, potRadius * 0.8, potHeight, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Jord */}
      <mesh position={[0, potHeight - 0.02, 0]}>
        <cylinderGeometry args={[potRadius * 0.95, potRadius * 0.95, 0.04, 12]} />
        <meshStandardMaterial color="#654321" roughness={1.0} />
      </mesh>
      
      {/* Växtstam/bas */}
      {plantConfig.type === 'tree' && (
        <mesh position={[0, potHeight + plantConfig.height/3, 0]}>
          <cylinderGeometry args={[0.02, 0.04, plantConfig.height/2, 8]} />
          <meshStandardMaterial color={plantConfig.color} roughness={0.9} />
        </mesh>
      )}
      
      {/* Växtblad baserat på typ */}
      {plantConfig.type === 'tree' && (
        <>
          {/* Krona för träd */}
          <mesh position={[0, potHeight + plantConfig.height * 0.75, 0]}>
            <sphereGeometry args={[plantConfig.width/3, 12, 8]} />
            <meshStandardMaterial color={plantConfig.leafColor} roughness={0.6} />
          </mesh>
          {/* Extra blad */}
          <mesh position={[plantConfig.width/4, potHeight + plantConfig.height * 0.65, plantConfig.width/4]}>
            <sphereGeometry args={[plantConfig.width/4, 8, 6]} />
            <meshStandardMaterial color={plantConfig.leafColor} roughness={0.6} />
          </mesh>
        </>
      )}
      
      {plantConfig.type === 'broad' && (
        <>
          {/* Stora breda blad för Monstera */}
          {[0, 1, 2, 3, 4].map(i => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI * 2 / 5) * plantConfig.width/3,
                potHeight + 0.2 + i * 0.15,
                Math.sin(i * Math.PI * 2 / 5) * plantConfig.width/3
              ]}
              rotation={[Math.PI/4, i * Math.PI * 2 / 5, 0]}
            >
              <planeGeometry args={[0.3, 0.4]} />
              <meshStandardMaterial color={plantConfig.leafColor} side={THREE.DoubleSide} roughness={0.5} />
            </mesh>
          ))}
        </>
      )}
      
      {plantConfig.type === 'bamboo' && (
        <>
          {/* Bambustavar */}
          {[0, 1, 2].map(i => (
            <mesh 
              key={i}
              position={[
                (i - 1) * 0.1,
                potHeight + plantConfig.height/2,
                (i - 1) * 0.05
              ]}
            >
              <cylinderGeometry args={[0.01, 0.01, plantConfig.height, 6]} />
              <meshStandardMaterial color={plantConfig.color} roughness={0.7} />
            </mesh>
          ))}
          {/* Bambublad */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI / 3) * 0.15,
                potHeight + plantConfig.height * 0.8 + Math.random() * 0.2,
                Math.sin(i * Math.PI / 3) * 0.15
              ]}
              rotation={[0, i * Math.PI / 3, Math.PI/6]}
            >
              <planeGeometry args={[0.15, 0.08]} />
              <meshStandardMaterial color={plantConfig.leafColor} side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
          ))}
        </>
      )}
      
      {plantConfig.type === 'palm' && (
        <>
          {/* Palmstam */}
          <mesh position={[0, potHeight + plantConfig.height/2, 0]}>
            <cylinderGeometry args={[0.03, 0.05, plantConfig.height, 8]} />
            <meshStandardMaterial color={plantConfig.color} roughness={0.8} />
          </mesh>
          {/* Palmblad */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI / 4) * 0.3,
                potHeight + plantConfig.height * 0.9,
                Math.sin(i * Math.PI / 4) * 0.3
              ]}
              rotation={[Math.PI/3, i * Math.PI / 4, 0]}
            >
              <planeGeometry args={[0.4, 0.1]} />
              <meshStandardMaterial color={plantConfig.leafColor} side={THREE.DoubleSide} roughness={0.5} />
            </mesh>
          ))}
        </>
      )}
      
      {plantConfig.type === 'spiky' && (
        <>
          {/* Sansevieria blad */}
          {[0, 1, 2, 3, 4].map(i => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI * 2 / 5) * 0.08,
                potHeight + plantConfig.height/2,
                Math.sin(i * Math.PI * 2 / 5) * 0.08
              ]}
              rotation={[0, i * Math.PI * 2 / 5, 0]}
            >
              <boxGeometry args={[0.05, plantConfig.height, 0.02]} />
              <meshStandardMaterial color={plantConfig.leafColor} roughness={0.7} />
            </mesh>
          ))}
        </>
      )}
      
      {plantConfig.type === 'cactus' && (
        <>
          {/* Huvudkaktus */}
          <mesh position={[0, potHeight + plantConfig.height/2, 0]}>
            <cylinderGeometry args={[0.06, 0.08, plantConfig.height, 8]} />
            <meshStandardMaterial color={plantConfig.color} roughness={0.9} />
          </mesh>
          {/* Små sidoskott */}
          <mesh position={[0.08, potHeight + plantConfig.height * 0.3, 0]}>
            <cylinderGeometry args={[0.03, 0.04, plantConfig.height * 0.4, 6]} />
            <meshStandardMaterial color={plantConfig.color} roughness={0.9} />
          </mesh>
        </>
      )}
      
      {plantConfig.type === 'herb' && (
        <>
          {/* Små buskiga blad för rosmarin */}
          {Array.from({length: 20}).map((_, i) => (
            <mesh 
              key={i}
              position={[
                (Math.random() - 0.5) * plantConfig.width,
                potHeight + Math.random() * plantConfig.height,
                (Math.random() - 0.5) * plantConfig.depth
              ]}
              rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            >
              <boxGeometry args={[0.02, 0.08, 0.01]} />
              <meshStandardMaterial color={plantConfig.leafColor} roughness={0.8} />
            </mesh>
          ))}
        </>
      )}
      
      {plantConfig.type === 'flower' && (() => {
        // Helper: create a soft petal/bud texture on an HTML canvas
        const createPetalTexture = (base: string, accent?: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d')!;
          // Background
          const g = ctx.createLinearGradient(0, 0, 0, 256);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.25, base);
          g.addColorStop(1, '#222');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 256, 256);
          // Petal vein
          ctx.strokeStyle = accent || '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(128, 20);
          ctx.quadraticCurveTo(150, 128, 128, 236);
          ctx.stroke();
          // soft vignette
          ctx.globalCompositeOperation = 'overlay';
          const rg = ctx.createRadialGradient(128, 128, 10, 128, 128, 180);
          rg.addColorStop(0, 'rgba(255,255,255,0.15)');
          rg.addColorStop(1, 'rgba(0,0,0,0.25)');
          ctx.fillStyle = rg;
          ctx.fillRect(0, 0, 256, 256);
          const tex = new THREE.CanvasTexture(canvas);
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          return tex;
        };

        // Lavender (detailed spikes)
        if (plantConfig.label && plantConfig.label.toLowerCase().includes('lavendel')) {
          return (
            <>
              {Array.from({length: 12}).map((_, si) => {
                const angle = si * Math.PI * 2 / 12;
                const stemX = Math.cos(angle) * 0.09;
                const stemZ = Math.sin(angle) * 0.09;
                return (
                  <group key={si} position={[stemX, 0, stemZ]}>
                    {/* stem */}
                    <mesh position={[0, potHeight + plantConfig.height/2, 0]}>
                      <cylinderGeometry args={[0.003, 0.004, plantConfig.height * 0.9, 6]} />
                      <meshStandardMaterial color="#3E5B2F" roughness={0.9} />
                    </mesh>
                    {/* spike of buds: many small spheres on a thin cylinder */}
                    {Array.from({length: 10}).map((_, bi) => (
                      <mesh
                        key={bi}
                        position={[0, potHeight + plantConfig.height * (0.6 + bi * 0.04), 0]}
                        rotation={[Math.random()*0.1, Math.random()*0.2, Math.random()*0.1]}
                        castShadow
                        receiveShadow
                      >
                        <sphereGeometry args={[0.007, 8, 6]} />
                        <meshStandardMaterial
                          color={'#9B59B6'}
                          emissive={'#7B3FA8'}
                          emissiveIntensity={0.05}
                          roughness={0.25}
                          metalness={0}
                        />
                      </mesh>
                    ))}
                  </group>
                );
              })}
            </>
          );
        }

        // Peace Lily (Fredens Lilja)
        if (plantConfig.label && plantConfig.label.toLowerCase().includes('fredens')) {
          const petalTex = createPetalTexture('#FFFFFF', '#F0F0F0');
          return (
            <>
              {/* broad glossy leaves */}
              {Array.from({length: 8}).map((_, i) => (
                <mesh
                  key={i}
                  position={[
                    Math.cos(i * Math.PI / 4) * (plantConfig.width/3 + Math.random()*0.06),
                    potHeight + 0.1 + Math.random()*plantConfig.height*0.3,
                    Math.sin(i * Math.PI / 4) * (plantConfig.width/3 + Math.random()*0.06)
                  ]}
                  rotation={[Math.PI/6 + Math.random()*0.2, i * Math.PI / 4 + Math.random()*0.4, Math.random()*0.2]}
                  receiveShadow
                  castShadow
                >
                  <planeGeometry args={[0.22, 0.36]} />
                  <meshStandardMaterial color={'#1E7F3B'} side={THREE.DoubleSide} roughness={0.25} map={createPetalTexture('#1E7F3B')} transparent opacity={0.95} />
                </mesh>
              ))}

              {/* Spathe / white flower */}
              {Array.from({length: 2}).map((_, fi) => (
                <group key={fi} position={[Math.cos(fi*Math.PI)*0.08, potHeight + plantConfig.height*0.65, Math.sin(fi*Math.PI)*0.08]}>
                  {/* spadix */}
                  <mesh position={[0, 0.06, 0]}>
                    <cylinderGeometry args={[0.006, 0.008, 0.16, 8]} />
                    <meshStandardMaterial color={'#F5E6C8'} roughness={0.6} />
                  </mesh>
                  {/* spathe (the white hood) */}
                  <mesh rotation={[Math.PI/2, 0, Math.PI/8]}>
                    <coneGeometry args={[0.06, 0.12, 24, 1, true]} />
                    <meshStandardMaterial map={petalTex} color={'#FFFBFA'} roughness={0.12} metalness={0.02} side={THREE.DoubleSide} transparent opacity={0.98} />
                  </mesh>
                </group>
              ))}
            </>
          );
        }

        // Generic flowering plant (layered petals)
        const petalTexture = createPetalTexture(plantConfig.leafColor || '#F08080', '#FFF');
        return (
          <>
            {/* short stems */}
            {Array.from({length: 5}).map((_, si) => (
              <mesh key={si} position={[Math.cos(si*Math.PI*2/5)*0.07, potHeight + plantConfig.height*0.35, Math.sin(si*Math.PI*2/5)*0.07]}>
                <cylinderGeometry args={[0.003, 0.004, plantConfig.height*0.6, 6]} />
                <meshStandardMaterial color={'#356B2A'} roughness={0.9} />
              </mesh>
            ))}

            {/* central flower: layered petals made from planes */}
            <group position={[0, potHeight + plantConfig.height*0.85, 0]}>
              {Array.from({length: 10}).map((_, pi) => (
                <mesh
                  key={pi}
                  rotation={[Math.PI/2, (pi/10)*Math.PI*2 + (pi%2?0.08:-0.08), 0]}
                  position={[Math.cos((pi/10)*Math.PI*2)*0.02, 0, Math.sin((pi/10)*Math.PI*2)*0.02]}
                  receiveShadow castShadow
                >
                  <planeGeometry args={[0.08 - (pi*0.003), 0.18 - (pi*0.01)]} />
                  <meshStandardMaterial map={petalTexture} color={plantConfig.leafColor} side={THREE.DoubleSide} roughness={0.18} transparent opacity={0.98} />
                </mesh>
              ))}
              {/* center stigma */}
              <mesh>
                <sphereGeometry args={[0.01, 8, 6]} />
                <meshStandardMaterial color={'#FFD166'} roughness={0.2} emissive={'#FFB84D'} emissiveIntensity={0.06} />
              </mesh>
            </group>
          </>
        );
      })()}
    </group>
  );
}

function StorageWall({ position, args, color, image, wallType, selectedWalls, wallHeight, design }: { 
  position: [number, number, number], 
  args: [number, number, number],
  color: string,
  image: string | null,
  wallType: 'back' | 'left' | 'right' | 'front',
  selectedWalls: { back: boolean; left: boolean; right: boolean; front: boolean; },
  wallHeight: number,
  design?: StorageWallDesign | null
}) {
  const shouldShowImage = image && selectedWalls[wallType];
  const [width, , depth] = args;
  
  // Bestäm vilken dimension som är väggytans bredd
  const wallWidth = width > depth ? width : depth;

  return (
    <>
      {/* Basvägg med färg */}
      <mesh position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial 
          color={design ? '#FFFFFF' : color}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      
      {/* Högupplöst design overlay från StoragePDFGenerator */}
      {design && (
        <StorageWallDesignOverlay
          design={design}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          position={[
            position[0] + (wallType === 'left' ? -0.06 : wallType === 'right' ? 0.06 : 0),
            position[1],
            position[2] + (wallType === 'back' ? -0.06 : wallType === 'front' ? 0.06 : 0)
          ]}
          rotation={
            wallType === 'left' ? [0, Math.PI / 2, 0] : 
            wallType === 'right' ? [0, -Math.PI / 2, 0] : 
            [0, 0, 0]
          }
        />
      )}
      
      {/* Högupplöst bildoverlay om bild är vald (fallback för gamla systemet) */}
      {!design && shouldShowImage && (
        <StorageWallOverlay
          imageUrl={image}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          position={[
            position[0] + (wallType === 'left' ? -0.06 : wallType === 'right' ? 0.06 : 0),
            position[1],
            position[2] + (wallType === 'back' ? -0.06 : wallType === 'front' ? 0.06 : 0)
          ]}
          rotation={
            wallType === 'left' ? [0, Math.PI / 2, 0] : 
            wallType === 'right' ? [0, -Math.PI / 2, 0] : 
            [0, 0, 0]
          }
        />
      )}
    </>
  );
}

function Furniture({ furnitureConfig, position, rotation }: { 
  furnitureConfig: any, 
  position: [number, number, number],
  rotation: number
}) {
  const baseHeight = 0.065; // Samma som mattan

  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {/* Barbord */}
      {furnitureConfig.type === 'table' && (
        <>
          {/* Stålben (slutar under bordsskivan) */}
          <mesh position={[0, baseHeight + furnitureConfig.height/2 - 0.025, 0]}>
            <cylinderGeometry args={[0.03, 0.05, furnitureConfig.height - 0.05, 8]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Bordsskiva */}
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.025, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2, furnitureConfig.width/2, 0.05, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          {/* Fotring */}
          <mesh position={[0, baseHeight + 0.3, 0]}>
            <torusGeometry args={[furnitureConfig.width/3, 0.02, 8, 16]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
        </>
      )}

      {/* Barstol */}
      {furnitureConfig.type === 'chair' && (
        <>
          {/* Stålben (slutar under sitsen) */}
          <mesh position={[0, baseHeight + 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 0.64, 8]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Sits */}
          <mesh position={[0, baseHeight + 0.65, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.5, furnitureConfig.width/2.5, 0.05, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
          {/* Ryggstöd */}
          <mesh position={[0, baseHeight + 0.85, furnitureConfig.width/4]} rotation={[Math.PI/12, 0, 0]}>
            <boxGeometry args={[furnitureConfig.width/2, 0.3, 0.03]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
          {/* Fotring */}
          <mesh position={[0, baseHeight + 0.25, 0]}>
            <torusGeometry args={[furnitureConfig.width/3, 0.015, 8, 16]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
        </>
      )}

      {/* Mysig pall */}
      {furnitureConfig.type === 'stool' && (
        <>
          {/* Mjuk överdel med rundare form */}
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.05, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.2, furnitureConfig.width/2.5, 0.1, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          {/* Mjuk mellandel */}
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.15, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.5, furnitureConfig.width/3, 0.1, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.4} />
          </mesh>
          {/* Bas med rundade hörn */}
          <mesh position={[0, baseHeight + furnitureConfig.height/2 - 0.1, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/3, furnitureConfig.width/3.2, furnitureConfig.height - 0.25, 12]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.6} />
          </mesh>
        </>
      )}

      {/* Pall (stool) */}
      {furnitureConfig.type === 'stool' && (
        <>
          {/* Ben */}
          {[-1, 1].map(x => (
            [-1, 1].map(z => (
              <mesh 
                key={`${x}-${z}`}
                position={[
                  x * (furnitureConfig.width/2 - 0.02),
                  baseHeight + furnitureConfig.height/2 - 0.02,
                  z * (furnitureConfig.depth/2 - 0.02)
                ]}
              >
                <boxGeometry args={[0.04, furnitureConfig.height - 0.04, 0.04]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
              </mesh>
            ))
          ))}
          {/* Sits */}
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.02, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2, furnitureConfig.width/2, 0.04, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Fåtölj (armchair) */}
      {furnitureConfig.type === 'armchair' && (
        <>
          {/* Sits */}
          <mesh position={[0, baseHeight + 0.15, 0]}>
            <boxGeometry args={[furnitureConfig.width, 0.15, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Ryggstöd */}
          <mesh position={[0, baseHeight + 0.35, furnitureConfig.depth/2 - 0.08]}>
            <boxGeometry args={[furnitureConfig.width, 0.4, 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Armstöd */}
          <mesh position={[furnitureConfig.width/2 - 0.08, baseHeight + 0.25, 0]}>
            <boxGeometry args={[0.15, 0.2, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[-furnitureConfig.width/2 + 0.08, baseHeight + 0.25, 0]}>
            <boxGeometry args={[0.15, 0.2, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Soffa */}
      {furnitureConfig.type === 'sofa' && (
        <>
          {/* Sits */}
          <mesh position={[0, baseHeight + 0.2, 0]}>
            <boxGeometry args={[furnitureConfig.width, 0.15, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Ryggstöd */}
          <mesh position={[0, baseHeight + 0.45, furnitureConfig.depth/2 - 0.08]}>
            <boxGeometry args={[furnitureConfig.width, 0.5, 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Armstöd */}
          <mesh position={[furnitureConfig.width/2 - 0.08, baseHeight + 0.35, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[-furnitureConfig.width/2 + 0.08, baseHeight + 0.35, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Fåtölj */}
      {furnitureConfig.type === 'armchair' && (
        <>
          {/* Sits */}
          <mesh position={[0, baseHeight + 0.25, 0]}>
            <boxGeometry args={[furnitureConfig.width - 0.15, 0.15, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Ryggstöd */}
          <mesh position={[0, baseHeight + 0.5, furnitureConfig.depth/2 - 0.08]} rotation={[-Math.PI/15, 0, 0]}>
            <boxGeometry args={[furnitureConfig.width - 0.15, 0.5, 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          {/* Armstöd */}
          <mesh position={[furnitureConfig.width/2 - 0.08, baseHeight + 0.4, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[-furnitureConfig.width/2 + 0.08, baseHeight + 0.4, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Sidobord */}
      {furnitureConfig.type === 'side_table' && (
        <>
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.03, 0]}>
            <boxGeometry args={[furnitureConfig.width, 0.06, furnitureConfig.depth]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          {/* Ben */}
          {[-1, 1].map(x => (
            [-1, 1].map(z => (
              <mesh 
                key={`${x}-${z}`}
                position={[
                  x * (furnitureConfig.width/2 - 0.03),
                  baseHeight + furnitureConfig.height/2 - 0.03,
                  z * (furnitureConfig.depth/2 - 0.03)
                ]}
              >
                <boxGeometry args={[0.05, furnitureConfig.height - 0.06, 0.05]} />
                <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
              </mesh>
            ))
          ))}
        </>
      )}

      {/* Podie (Vitlaserad furu) */}
      {furnitureConfig.type === 'podium' && (
        <>
          {/* Huvudkropp av podiet - en enhetlig vitlaserad furu */}
          <mesh position={[0, baseHeight + furnitureConfig.height/2, 0]}>
            <boxGeometry args={[furnitureConfig.width, furnitureConfig.height, furnitureConfig.depth]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Komponent för att exportera aktuell 3D-scen till Three.js JSON
// @ts-ignore - Unused function kept for future use
function SceneExporter({ orderData }: { orderData: OrderData }) {
  const { scene } = useThree();
  // @ts-ignore - Dynamic import type issue
  // @ts-ignore - Dynamic import type issue
  const { exportSceneToThreeJSON } = useMemo(() => import('./exportSceneToGLTF'), []);

  const handleExportCurrentScene = async () => {
    try {
      console.log('🎯 Exporterar aktuell 3D-scen till Three.js JSON...');

      // Skapa ett rent klon av scenen utan UI-element
      const cleanScene = scene.clone();

      // Ta bort eventuella UI-element eller icke-geometriska objekt
      cleanScene.traverse((child) => {
        // Behåll endast meshes och grupper med geometri
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Group)) {
          if (child.parent) {
            child.parent.remove(child);
          }
        }
      });

      // Räkna meshes i den rena scenen
      let meshCount = 0;
      cleanScene.traverse((child) => {
        if (child instanceof THREE.Mesh) meshCount++;
      });

      if (meshCount === 0) {
        alert('Inga 3D-objekt att exportera i den aktuella vyn.');
        return;
      }

      console.log('📊 Rensa scen innehåller', meshCount, 'meshes');

      // Generera filnamn baserat på orderData
      // @ts-ignore - customerInfo does not exist on OrderData type
      const customerName = orderData.customerInfo?.name || 'Unknown';
      const filename = `3D-scen_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Exportera den rena scenen
      await exportSceneToThreeJSON(cleanScene, filename);

    } catch (error) {
      console.error('❌ Fel vid export av aktuell scen:', error);
      alert('Kunde inte exportera 3D-scenen: ' + (error as Error).message);
    }
  };

  // Denna komponent renderar ingenting visuellt, den lägger bara till export-funktionalitet
  // Vi kan lägga till en knapp senare om det behövs, men för nu använder vi tangentbordsgenväg
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + J för att exportera aktuell scen
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'J') {
        event.preventDefault();
        handleExportCurrentScene();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [orderData]);

  return null; // Osynlig komponent
}

export default function App() {
  // 🛡️ SÄKERHETSVARIABLER
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);
  const DEV_ACCESS_CODE = "MONTER2025"; // Hemlig kod för utvecklarverktyg
  
  // 🛡️ REALISTISKA SKYDDSFUNKTIONER MOT MISSBRUK
  // OBS: Systemets printscreen (Cmd+Shift+4, PrtScr, etc.) KAN INTE blockeras av webbläsare!
  // Detta är en säkerhetsbegränsning - bara OS:et kan kontrollera dessa funktioner.
  // Fokus ligger därför på visuella avskräckningsmedel och blockering av andra vägar.
  useEffect(() => {
    // Logga sessionstart (kan skickas till server för spårning)
    const sessionId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 Session started: ${sessionId} at ${new Date().toISOString()}`);
    
    // Kontrollera för suspekt beteende
    let screenshotAttempts = 0;
    let rightClickAttempts = 0;
    
    // Förhindra utvecklarverktyg och vissa tangentbordsgenvägar
    const preventDeveloperTools = (e: KeyboardEvent) => {
      // Om utvecklarverktyg är upplåsta, tillåt allt
      if (devToolsUnlocked) {
        return true;
      }
      
      // ENKLARE UPPLÅSNING: Tryck "U" tre gånger snabbt (inom 2 sekunder)
      if (e.key === 'u' || e.key === 'U') {
        const now = Date.now();
        if (!(window as any).lastUPress || now - (window as any).lastUPress > 2000) {
          (window as any).uPressCount = 1;
        } else {
          (window as any).uPressCount = ((window as any).uPressCount || 0) + 1;
        }
        (window as any).lastUPress = now;
        
        console.log(`🔤 U pressed ${(window as any).uPressCount} times`);
        
        if ((window as any).uPressCount >= 3) {
          e.preventDefault();
          const userCode = prompt('🎯 Du hittade den hemliga kombinationen! Ange utvecklarkod:');
          if (userCode === DEV_ACCESS_CODE) {
            setDevToolsUnlocked(true);
            alert('✅ Utvecklarverktyg upplåsta! Du kan nu använda Cmd+Option+I, högerklick, etc.');
            console.log('🔓 Developer tools unlocked by authorized user (triple U method)');
            (window as any).uPressCount = 0;
          } else if (userCode !== null) {
            alert('❌ Felaktig kod. Rätt kod är: MONTER2025');
          }
          return false;
        }
      }
      
      // Speciell kombination för Mac: Cmd+Shift+Alt+M (eller Ctrl+Shift+Alt+M på PC)
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.altKey && e.key === 'M')) {
        e.preventDefault();
        console.log('🔑 Unlock combination detected! Keys pressed:', {
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey, 
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          key: e.key
        });
        const userCode = prompt('🔑 Ange utvecklarkod för att låsa upp utvecklarverktyg:');
        console.log('User entered code:', userCode, 'Expected:', DEV_ACCESS_CODE);
        if (userCode === DEV_ACCESS_CODE) {
          setDevToolsUnlocked(true);
          alert('✅ Utvecklarverktyg upplåsta! Du kan nu använda Cmd+Option+I, högerklick, etc.');
          console.log('🔓 Developer tools unlocked by authorized user');
        } else if (userCode !== null) {
          alert('❌ Felaktig kod. Rätt kod är: MONTER2025');
        }
        return false;
      }
      
      // Blockera Mac utvecklarverktyg (Cmd+Option+I, Cmd+Option+J, Cmd+Option+C)
      if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        screenshotAttempts++;
        console.warn(`🚨 Mac Developer tools attempt #${screenshotAttempts} from session ${sessionId}`);
        
        if (screenshotAttempts > 2) {
          alert('🚫 För många försök att öppna utvecklarverktyg har upptäckts.\nSessionen loggas för säkerhetsändamål.\n\n💡 Tips: Auktoriserad personal kan låsa upp med Cmd+Shift+Alt+M');
        } else {
          alert('🚫 Utvecklarverktyg är inte tillåtna.\nKontakta Monterhyra för licensiering.\n\n💡 Tips: Auktoriserad personal kan låsa upp med Cmd+Shift+Alt+M');
        }
        return false;
      }
      
      // Blockera PC utvecklarverktyg (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C) 
      if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
          e.key === 'F12' || // Dev tools
          (e.ctrlKey && e.key === 'u') || // PC View source
          (e.metaKey && e.key === 'u')) { // Mac View source
        e.preventDefault();
        screenshotAttempts++;
        console.warn(`🚨 Developer tools attempt #${screenshotAttempts} from session ${sessionId}`);
        
        if (screenshotAttempts > 2) {
          alert('🚫 För många försök att öppna utvecklarverktyg har upptäckts.\nSessionen loggas för säkerhetsändamål.\n\n💡 Tips: Auktoriserad personal kan låsa upp med Cmd+Shift+Alt+M (Mac) eller Ctrl+Shift+Alt+M (PC)');
        } else {
          alert('🚫 Utvecklarverktyg är inte tillåtna.\nKontakta Monterhyra för licensiering.\n\n💡 Tips: Auktoriserad personal kan låsa upp med Cmd+Shift+Alt+M (Mac) eller Ctrl+Shift+Alt+M (PC)');
        }
        return false;
      }
      
      // OBS: PrintScreen (PrtScr, Cmd+Shift+4, etc.) KAN INTE blockeras av webbläsaren
      // Dessa hanteras av operativsystemet och är utanför webbläsarens kontroll
    };

    // Förhindra högerklick ENDAST på skyddade element (inte på 3D-objekt)
    const preventRightClick = (e: MouseEvent) => {
      // Om utvecklarverktyg är upplåsta, tillåt högerklick överallt
      if (devToolsUnlocked) {
        return true;
      }
      
      const target = e.target as HTMLElement;
      
      // Tillåt högerklick på Canvas och 3D-element för att ta bort objekt
      if (target.tagName === 'CANVAS' || 
          target.closest('canvas') || 
          target.closest('[data-testid="canvas-container"]')) {
        return true; // Tillåt högerklick på 3D-vyn
      }
      
      // Blockera högerklick på bilder, menyer och andra UI-element
      if (target.tagName === 'IMG' || 
          target.closest('img') ||
          target.closest('.sidebar') ||
          target.closest('[style*="position: absolute"]')) {
        e.preventDefault();
        rightClickAttempts++;
        console.warn(`🚨 Right-click blocked on protected element #${rightClickAttempts} from session ${sessionId}`);
        
        if (rightClickAttempts <= 2) {
          alert('🚫 Högerklick är inaktiverat på skyddade element.');
        }
        return false;
      }
      
      return true; // Tillåt högerklick på allt annat
    };

    // Förhindra drag & drop av bilder
    const preventDragDrop = (e: DragEvent) => {
      if (devToolsUnlocked) return true; // Tillåt om upplåst
      e.preventDefault();
      return false;
    };

    // Förhindra textmarkering
    const preventSelection = (e: Event) => {
      if (devToolsUnlocked) return true; // Tillåt om upplåst
      e.preventDefault();
      return false;
    };

    // Lägg till event listeners
    document.addEventListener('keydown', preventDeveloperTools);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('selectstart', preventSelection);

    // Förhindra zoom-in för att dölja vattenstämpel
    const preventZoom = (e: WheelEvent) => {
      if (devToolsUnlocked) return true; // Tillåt om upplåst
      // Blockera både Ctrl (PC) och Cmd (Mac) zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventZoom, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('keydown', preventDeveloperTools);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('wheel', preventZoom);
    };
  }, [devToolsUnlocked]); // Lägg till devToolsUnlocked som dependency

  const captureRef = useRef<any>(null);
  const [counterSize, setCounterSize] = useState(DESK_SIZES[0].width);
  const [tvMarkersVisible, setTvMarkersVisible] = useState(false);
  const [tvs, setTvs] = useState<Array<{id: number, size: number, wall: string, position: number, heightIndex: number, orientation: 'landscape'|'portrait'}>>([]);
  const [nextTvId, setNextTvId] = useState(1);
  const [selectedTvMarker, setSelectedTvMarker] = useState<{wall: string, position: number, heightIndex: number} | null>(null);
  const [storages, setStorages] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [storageMarkersVisible, setStorageMarkersVisible] = useState(false);
  const [nextStorageId, setNextStorageId] = useState(1);
  const [selectedStorageMarker, setSelectedStorageMarker] = useState<{x: number, z: number} | null>(null);
  const [floorIndex, setFloorIndex] = useState<number|null>(null);
  const [customFloorWidth, setCustomFloorWidth] = useState(3);
  const [customFloorDepth, setCustomFloorDepth] = useState(1.5);
  const [carpetIndex, setCarpetIndex] = useState(0);
  const [wallShape, setWallShape] = useState('');
  const [wallHeight, setWallHeight] = useState(WALL_HEIGHTS[0].value);
  const [graphic, setGraphic] = useState('none');
  const [showLights, setShowLights] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageLeft, setUploadedImageLeft] = useState<string | null>(null);
  const [uploadedImageRight, setUploadedImageRight] = useState<string | null>(null);
  const [forexImageBack, setForexImageBack] = useState<string | null>(null);
  const [forexImageLeft, setForexImageLeft] = useState<string | null>(null);
  const [forexImageRight, setForexImageRight] = useState<string | null>(null);
  const [counters, setCounters] = useState<Array<{id: number, type: string, position: {x: number, z: number}, rotation: number}>>([]);
  const [counterMarkersVisible, setCounterMarkersVisible] = useState(false);
  const [nextCounterId, setNextCounterId] = useState(1);
  const [selectedMarkerPosition, setSelectedMarkerPosition] = useState<{x: number, z: number} | null>(null);
  const [selectedCounterType, setSelectedCounterType] = useState(1); // Vald disktyp
  const [selectedTvSize, setSelectedTvSize] = useState(0); // Vald TV-storlek (0 = Ingen)
  const [selectedTrussType, setSelectedTrussType] = useState(0); // Vald truss-typ
  
  // Diskobjekt inställningar
  const [showEspressoMachine, setShowEspressoMachine] = useState(false);
  const [showFlowerVase, setShowFlowerVase] = useState(false);
  const [showCandyBowl, setShowCandyBowl] = useState(false);
  const [selectedStorageType, setSelectedStorageType] = useState(1); // Vald förråd-storlek
  
  // Nya placerbara funktioner
  const [showExtraPower, setShowExtraPower] = useState(false); // Endast för pris
  const [wallShelves, setWallShelves] = useState<Array<{id: number, wall: string, position: {x: number, y: number}}>>([]);
  const [shelfMarkersVisible, setShelfMarkersVisible] = useState(false);
  const [nextShelfId, setNextShelfId] = useState(1);
  const [showClothingRacks, setShowClothingRacks] = useState(false);
  const [speakers, setSpeakers] = useState<Array<{id: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [speakerMarkersVisible, setSpeakerMarkersVisible] = useState(false);
  const [nextSpeakerId, setNextSpeakerId] = useState(1);
  const [speakerSize, setSpeakerSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // VEPA PDF Generator state
  const [showVepaPDFGenerator, setShowVepaPDFGenerator] = useState(false);
  const [showForexPDFGenerator, setShowForexPDFGenerator] = useState(false);
  const [showStoragePDFGenerator, setShowStoragePDFGenerator] = useState(false);
  const [showCounterPDFGenerator, setShowCounterPDFGenerator] = useState(false);
  const [selectedStorageForDesign, setSelectedStorageForDesign] = useState<number | null>(null);
  const [vepaWallDesigns, setVepaWallDesigns] = useState<any[]>([]);
  const [forexWallDesigns, setForexWallDesigns] = useState<any[]>([]);
  const [storageDesigns, setStorageDesigns] = useState<Map<number, { designs: StorageWallDesign[], printType: 'vepa' | 'forex' }>>(new Map());
  const [counterDesigns, setCounterDesigns] = useState<{ designs: CounterDesign[], printType: 'vepa' | 'forex' } | null>(null);
  
  // Admin Portal state
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [loggedInExhibitor, setLoggedInExhibitor] = useState<Exhibitor | null>(null);
  
  // Collapsed state for live packlists - standardmässigt minimerade
  const [floatingPacklistCollapsed, setFloatingPacklistCollapsed] = useState(true);
  // const [compactPacklistCollapsed, setCompactPacklistCollapsed] = useState(true); // Unused - commented out
  // Collapsed state for price section - standardmässigt minimerad
  const [priceSectionCollapsed, setPriceSectionCollapsed] = useState(true);
  // Collapsed state for floating price box
  const [floatingPriceCollapsed, setFloatingPriceCollapsed] = useState(false);
  
  // Mässmiljö toggle
  const [showExhibitionHall, setShowExhibitionHall] = useState(false);
  
  // Mässhalls-montrar state  
  const [exhibitionBooths] = useState<Record<string, string>>({
    // Rad 1 - Vänster sida
    'booth-1': 'tech-startup',
    'booth-2': 'fashion-brand', 
    'booth-3': 'food-company',
    'booth-4': 'wellness-spa',
    'booth-5': 'minimal-design',
    
    // Rad 2 - Mitt-vänster  
    'booth-6': 'tech-startup',
    'booth-7': 'fashion-brand',
    'booth-8': 'food-company',
    
    // Rad 4 - Mitt-höger
    'booth-9': 'wellness-spa',
    'booth-10': 'minimal-design',
    'booth-11': 'tech-startup', 
    'booth-12': 'fashion-brand',
    
    // Rad 5 - Höger sida
    'booth-13': 'food-company',
    'booth-14': 'wellness-spa',
    'booth-15': 'minimal-design',
    'booth-16': 'tech-startup',
    'booth-17': 'fashion-brand'
  });
  
  // Dölja grid under PDF-generering
  const [hideGridForCapture, setHideGridForCapture] = useState(false);
  
  const [plants, setPlants] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [plantMarkersVisible, setPlantMarkersVisible] = useState(false);
  const [nextPlantId, setNextPlantId] = useState(1);
  const [selectedPlantType, setSelectedPlantType] = useState(0); // Vald växttyp
  const [furniture, setFurniture] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [furnitureMarkersVisible, setFurnitureMarkersVisible] = useState(false);
  
  // Mobile state - step-based navigation
  const [mobileStep, setMobileStep] = useState(0); // 0=storlek, 1=väggar, 2=möbler, 3=detaljer
  const [nextFurnitureId, setNextFurnitureId] = useState(1);
  const [selectedFurnitureType, setSelectedFurnitureType] = useState(0); // Vald möbeltyp
  const [storageColor, setStorageColor] = useState('#BFBFBF'); // Förrådens färg
  const [storageGraphic, setStorageGraphic] = useState('none'); // Förrådens grafik
  const [storageUploadedImage, setStorageUploadedImage] = useState<string | null>(null);
  const [storageWallSelections, setStorageWallSelections] = useState({
    back: false,
    left: false,
    right: false,
    front: false
  }); // Vilka väggar som ska ha trycket
  
  // Diskars färginställningar
  const [counterPanelColor, setCounterPanelColor] = useState('#ffffff'); // Färg på diskpaneler (framsida + sidor)
  const [counterFrontImage, setCounterFrontImage] = useState<string | null>(null); // Eget tryck på framsidan
  
  // Registrerings-modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    orgNumber: '',
    eventName: '',
    eventCity: '',
    buildDate: '',
    teardownDate: '',
    eventDate: ''
  });
  const [registrationTimer, setRegistrationTimer] = useState<number | null>(null);
  
  // State för att tvinga re-render av texturer
  const [textureKey, setTextureKey] = useState(0);

  // Optimerad textur-cache för att undvika fladdring
  const counterTexture = useMemo(() => {
    if (!counterFrontImage) return null;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(counterFrontImage, () => {
      // Callback när texturen är laddad
      texture.needsUpdate = true;
      // Tvinga re-render genom att uppdatera key
      setTextureKey(prev => prev + 1);
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.flipY = false; // Fixa orienteringen så bilden visas rätt håll
    texture.needsUpdate = true; // Säkerställ att texturen uppdateras
    return texture;
  }, [counterFrontImage]);

  // Säkerställ att alla counters re-renderas när texturen ändras
  useEffect(() => {
    if (counterFrontImage && counterTexture) {
      // Tvinga en re-render genom att uppdatera textureKey
      setTextureKey(prev => prev + 1);
    }
  }, [counterFrontImage, counterTexture]);

  // Förberedd för framtida individuella väggbilder
  // const [storageImages, setStorageImages] = useState({
  //   back: null as string | null,
  //   left: null as string | null,
  //   right: null as string | null,
  //   front: null as string | null
  // }); // Olika bilder för olika väggar
  // Prevent "declared but never read" TS warnings for a few optional states used elsewhere
  // (kept as noop references so they don't alter behavior)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __unused_refs = [counterSize, setCounterSize, selectedTvMarker, setSelectedTvMarker, selectedStorageMarker, setSelectedStorageMarker, selectedMarkerPosition, setSelectedMarkerPosition];
  
  // ⏰ REGISTRERINGS-TIMER: Visa formulär efter 60 sekunder
  useEffect(() => {
    // Starta timer som visar registreringsmodalen efter 60 sekunder
    const timer = setTimeout(() => {
      if (!isRegistered) {
        setShowRegistrationModal(true);
      }
    }, 60000); // 60 sekunder (1 minut)

    setRegistrationTimer(timer);

    return () => {
      if (registrationTimer) {
        clearTimeout(registrationTimer);
      }
      clearTimeout(timer);
    };
  }, [isRegistered]);
  
  // Återställ markers när man byter tv-storlek eller antal
  // React.useEffect(() => { setTvMarkersVisible(true); }, [tvIndex, tvCount]);

  // Prisfunktion
  const calculatePrice = () => {
    let totalPrice = 0;
    
    if (floorIndex === null) return 0;
    
    const floorDimensions = (() => {
      const floorConfig = FLOOR_SIZES[floorIndex];
      if (floorConfig?.custom) {
        return { width: customFloorWidth, depth: customFloorDepth };
      }
      return { width: floorConfig.width, depth: floorConfig.depth };
    })();
    
    // Väggpriser (per 1m segment, varierar med höjd)
    let pricePerWallMeter = 862; // 2,5m som standard
    if (wallHeight === 3) pricePerWallMeter = 982;
    else if (wallHeight === 3.5) pricePerWallMeter = 1342;
    
    if (wallShape === 'straight') {
      // Rak vägg = baksida endast
      const backWallLength = floorDimensions.width;
      const numberOfWallSegments = Math.ceil((backWallLength * 2) ) / 2; // 0.5m segment, alltid uppåt
      totalPrice += numberOfWallSegments * pricePerWallMeter;
    } else if (wallShape === 'l') {
      // L-form = baksida + vänster sida
      const backWallLength = floorDimensions.width;
      const leftWallLength = floorDimensions.depth;
      const totalWallLength = backWallLength + leftWallLength;
      const numberOfWallSegments = Math.ceil((totalWallLength * 2) ) / 2;
      totalPrice += numberOfWallSegments * pricePerWallMeter;
    } else if (wallShape === 'u') {
      // U-form = baksida + vänster + höger sida
      const backWallLength = floorDimensions.width;
      const sideWallLength = floorDimensions.depth * 2; // båda sidorna
      const totalWallLength = backWallLength + sideWallLength;
      const numberOfWallSegments = Math.ceil((totalWallLength * 2) ) / 2;
      totalPrice += numberOfWallSegments * pricePerWallMeter;
    }
    
    // Matta/golvpriser (145 kr per kvm för färg, 180 kr för EXPO, 240 kr för SALSA, 255 kr för rutor)
    const floorArea = Math.round((floorDimensions.width * 100) * (floorDimensions.depth * 100)) / 10000; // alltid två decimaler
    if (carpetIndex > 0) { // Alla mattor utom "Ingen matta"
      const selectedCarpet = CARPET_COLORS[carpetIndex];
      if (selectedCarpet.color && selectedCarpet.color.startsWith('checkerboard-')) {
        // Rutmönster - 255 kr per kvm
        totalPrice += floorArea * 255;
      } else if (selectedCarpet.name.startsWith('EXPO')) {
        // EXPO färger - 180 kr per kvm
        totalPrice += floorArea * 180;
      } else if (selectedCarpet.name.startsWith('SALSA')) {
        // SALSA färger - 240 kr per kvm (180 + 60)
        totalPrice += floorArea * 240;
      } else {
        // Vanliga färgmattor - 145 kr per kvm
        totalPrice += floorArea * 145;
      }
    }
    
    // Grafik
    if (graphic === 'hyr') {
      // Hyrgrafik - 200 kr per kvm väggyta
      let totalWallArea = 0;
      if (wallShape === 'straight') totalWallArea = floorDimensions.width * wallHeight;
      else if (wallShape === 'l') totalWallArea = (floorDimensions.width + floorDimensions.depth) * wallHeight;
      else if (wallShape === 'u') totalWallArea = (floorDimensions.width + (floorDimensions.depth * 2)) * wallHeight;
      
      totalPrice += totalWallArea * 200;
    } else if (graphic === 'forex') {
      let pricePerMeter = 1450; // 2,5m som standard
      if (wallHeight === 3) pricePerMeter = 2000;
      if (wallHeight === 3.5) pricePerMeter = 2850;
      
      let totalWallLength = 0;
      if (wallShape === 'straight') totalWallLength = floorDimensions.width;
      else if (wallShape === 'l') totalWallLength = floorDimensions.width + floorDimensions.depth;
      else if (wallShape === 'u') totalWallLength = floorDimensions.width + (floorDimensions.depth * 2);
      
      totalPrice += totalWallLength * pricePerMeter;
    } else if (graphic === 'vepa') {
      // 700 kr per kvm
      let totalWallArea = 0;
      if (wallShape === 'straight') totalWallArea = floorDimensions.width * wallHeight;
      else if (wallShape === 'l') totalWallArea = (floorDimensions.width + floorDimensions.depth) * wallHeight;
      else if (wallShape === 'u') totalWallArea = (floorDimensions.width + (floorDimensions.depth * 2)) * wallHeight;
      
      totalPrice += totalWallArea * 700;
    }
    
    // TV-priser
    tvs.forEach(tv => {
      const tvConfig = TV_SIZES[tv.size];
      if (tvConfig.label === '32"') totalPrice += 2000;
      else if (tvConfig.label === '43"') totalPrice += 2500;
      else if (tvConfig.label === '55"') totalPrice += 3500;
      else if (tvConfig.label === '70"') totalPrice += 5500;
      else if (tvConfig.label === '75" beTV') totalPrice += 11000;
      // "Ingen" TV kostar inget (tvConfig.label === 'Ingen')
    });
    
    // Diskpriser (baserat på 1m disk = 3500 kr + 760 kr per 0,5m steg)
    counters.forEach(counter => {
      const counterConfig = COUNTER_TYPES.find(ct => ct.label === counter.type);
      if (!counterConfig) return;
      if (counterConfig.width === 1) totalPrice += 3500; // 1m disk
      else if (counterConfig.width === 1.5) totalPrice += 3500 + 760; // 1,5m disk (4260 kr)
      else if (counterConfig.width === 2) totalPrice += 3500 + 1520; // 2m disk (5020 kr)
      else if (counterConfig.width === 2.5) totalPrice += 3500 + 2280; // 2,5m disk (5780 kr)
      else if (counterConfig.width === 3) totalPrice += 3500 + 3040; // 3m disk (6540 kr)
      else if (counterConfig.width === 3.5) totalPrice += 3500 + 3800; // 3,5m disk (7300 kr)
      else if (counterConfig.width === 4) totalPrice += 3500 + 4560; // 4m disk (8060 kr)
      else if (counterConfig.type === 'L' || counterConfig.type === 'L-mirrored') {
        // L-disk har eget pris
        totalPrice += 8500;
      }
    });
    
    // Diskobjekt
    if (showEspressoMachine) totalPrice += 3500;
    if (showFlowerVase) totalPrice += 450;
    if (showCandyBowl) totalPrice += 250;
    
    // Förråd (samma pris som väggar)
    storages.forEach(storage => {
      const storageConfig = STORAGE_TYPES[storage.type];
      // Beräkna väggarea för förrådet
      const storageWallLength = (storageConfig.width * 2) + (storageConfig.depth * 2);
      const numberOfWallSegments = Math.ceil((storageWallLength * 2)) / 2; // 0.5m segment, alltid uppåt
      totalPrice += numberOfWallSegments * pricePerWallMeter;
    });
    
    // Växter (850 kr per växt)
    totalPrice += plants.length * 850;
    
    // Möbler
    furniture.forEach(furnitureItem => {
      const furnitureConfig = FURNITURE_TYPES[furnitureItem.type];
      if (furnitureConfig.label === 'Barbord') totalPrice += 850;
      else if (furnitureConfig.label === 'Barstol') totalPrice += 550;
      else if (furnitureConfig.label === 'Mysig pall') totalPrice += 600;
      else if (furnitureConfig.label === 'Soffa 2-sits') totalPrice += 1350;
      else if (furnitureConfig.label === 'Soffa 3-sits') totalPrice += 1550;
      else if (furnitureConfig.label === 'Fåtölj') totalPrice += 850;
      else if (furnitureConfig.label === 'Sidobord') totalPrice += 380;
    });
    
    // Belysning
    if (showLights) {
      // Enkla lampor 300 kr varje
      let numberOfLights = 0;
      // Beräkna antal lampor baserat på väggarea, alltid räkna med halva meter
      if (wallShape === 'straight') numberOfLights = Math.ceil(floorDimensions.width * 2) / 2;
      else if (wallShape === 'l') numberOfLights = Math.ceil((floorDimensions.width + floorDimensions.depth) * 2) / 2;
      else if (wallShape === 'u') numberOfLights = Math.ceil((floorDimensions.width + (floorDimensions.depth * 2)) * 2) / 2;
      totalPrice += numberOfLights * 300;
    }
    
    // Truss
    const selectedTruss = TRUSS_TYPES[selectedTrussType];
    if (selectedTruss.type === 'front-straight') {
      totalPrice += floorDimensions.width * 370; // 370 kr per meter
    } else if (selectedTruss.type === 'hanging-round' && 'diameter' in selectedTruss) {
      const circumference = Math.PI * selectedTruss.diameter;
      totalPrice += circumference * 370;
    } else if (selectedTruss.type === 'hanging-square' && 'width' in selectedTruss) {
      const perimeter = (selectedTruss.width * 2) + (selectedTruss.depth * 2);
      totalPrice += perimeter * 370;
    }
    
    // Väggdekorationer
    wallShelves.forEach(() => {
      totalPrice += 550; // 550 kr per hylla
    });
    
    speakers.forEach(() => {
      if (speakerSize === 'small') totalPrice += 4500;
      else if (speakerSize === 'medium') totalPrice += 5500;
      else if (speakerSize === 'large') totalPrice += 8500;
    });
    
    if (showClothingRacks) {
      totalPrice += 550; // Klädhängare 550 kr
    }
    
    // Extra el
    if (showExtraPower) {
      totalPrice += 750;
    }
    
    return totalPrice;
  };

  // Beräkna vilka förrådsväggar som är fria (inte mot montervägg)
  const calculateFreeStorageWalls = (storage: {type: number, position: {x: number, z: number}, rotation: number}) => {
    if (!floorIndex) return { back: true, left: true, right: true, front: true };
    
    const floor = FLOOR_SIZES[floorIndex];
    const actualWidth = floor.custom ? customFloorWidth : floor.width;
    const actualDepth = floor.custom ? customFloorDepth : floor.depth;
    const storageConfig = STORAGE_TYPES[storage.type];
    
    // Definiera tröskelvärde för när en vägg är "mot" monterväggen (0.6m = 60cm marginal)
    const WALL_THRESHOLD = 0.6;
    
    // Förrådens väggar i lokalkoordinater (före rotation)
    const localBack = -storageConfig.depth / 2;
    const localFront = storageConfig.depth / 2;
    const localLeft = -storageConfig.width / 2;
    const localRight = storageConfig.width / 2;
    
    // Rotera förrådet och kolla mot monterväggarna
    const rad = (storage.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    // @ts-ignore - Unused variable kept for reference
    const _sin = Math.sin(rad);
    
    // Monterväggpositioner
    const boothBackWall = -actualDepth / 2;
    // @ts-ignore - Unused variable kept for reference
    const _boothFrontWall = actualDepth / 2;
    const boothLeftWall = -actualWidth / 2;
    const boothRightWall = actualWidth / 2;
    
    // Beräkna världspositioner för förråd väggar
    const backWorldZ = storage.position.z + localBack * cos;
    const frontWorldZ = storage.position.z + localFront * cos;
    const leftWorldX = storage.position.x + localLeft * cos;
    const rightWorldX = storage.position.x + localRight * cos;
    
    // Kolla vilka väggar som är nära monterväggar
    const freeWalls = {
      back: true,
      left: true,
      right: true,
      front: true
    };
    
    // Kolla bakvägg mot booth back wall (endast för straight, l, u)
    if (wallShape === 'straight' || wallShape === 'l' || wallShape === 'u') {
      if (Math.abs(backWorldZ - boothBackWall) < WALL_THRESHOLD) {
        freeWalls.back = false;
      }
    }
    
    // Kolla vänster vägg mot booth left wall (endast för l, u)
    if (wallShape === 'l' || wallShape === 'u') {
      if (Math.abs(leftWorldX - boothLeftWall) < WALL_THRESHOLD) {
        freeWalls.left = false;
      }
    }
    
    // Kolla höger vägg mot booth right wall (endast för u)
    if (wallShape === 'u') {
      if (Math.abs(rightWorldX - boothRightWall) < WALL_THRESHOLD) {
        freeWalls.right = false;
      }
    }
    
    console.log('🧮 Calculated free storage walls:', { 
      storageId: storage, 
      freeWalls, 
      wallShape,
      positions: { backWorldZ, frontWorldZ, leftWorldX, rightWorldX },
      boothWalls: { boothBackWall, boothLeftWall, boothRightWall }
    });
    
    return freeWalls;
  };

  // Arbetstidsberäkning för byggnation och rivning
  const calculateLaborCosts = () => {
    if (floorIndex === null) return { buildHours: 0, demolitionHours: 0, buildCost: 0, demolitionCost: 0, adminFee: 0, consumables: 0, persons: 2, area: 0 };
    
    const floorDimensions = (() => {
      const floorConfig = FLOOR_SIZES[floorIndex];
      if (floorConfig?.custom) {
        return { width: customFloorWidth, depth: customFloorDepth };
      }
      return { width: floorConfig.width, depth: floorConfig.depth };
    })();
    
    // Hitta närmaste standardstorlek för custom floors
    const getNearestStandardSize = (width: number, depth: number) => {
      const area = width * depth;
      const standardSizes = FLOOR_SIZES.filter(size => !size.custom);
      
      // Hitta närmaste större eller lika storlek
      const validSizes = standardSizes.filter(size => size.width * size.depth >= area);
      if (validSizes.length === 0) {
        // Om större än alla standardstorlekar, ta största
        return standardSizes[standardSizes.length - 1];
      }
      
      // Ta minsta av de giltiga storlekarna
      return validSizes.reduce((min, current) => 
        (current.width * current.depth) < (min.width * min.depth) ? current : min
      );
    };
    
    const effectiveSize = floorIndex !== null && FLOOR_SIZES[floorIndex]?.custom
      ? getNearestStandardSize(floorDimensions.width, floorDimensions.depth)
      : floorDimensions;
    
    // Bestäm antal personer och bastid baserat på storlek
    let persons = 2;
    let baseHours = 4; // Minst 4h
    
    const area = effectiveSize.width * effectiveSize.depth;
    
    if (area <= 9) {
      // 3x3 och mindre: 2 personer, 4h
      persons = 2;
      baseHours = 4;
    } else if (area <= 12) {
      // 3x4, 4x3: 2 personer, 6h
      persons = 2;
      baseHours = 6;
    } else if (area <= 16) {
      // 4x4: 2 personer, 8h
      persons = 2;
      baseHours = 8;
    } else if (area <= 25) {
      // 5x5 och mindre: 2 personer, 10h
      persons = 2;
      baseHours = 10;
    } else if (area <= 36) {
      // 6x6 och mindre: 2 personer, 12h
      persons = 2;
      baseHours = 12;
    } else {
      // Större än 6x6: 3 personer
      persons = 3;
      if (area <= 49) baseHours = 9; // 7x7: 3 personer, 9h
      else if (area <= 64) baseHours = 12; // 8x8: 3 personer, 12h
      else baseHours = 15; // 10x10+: 3 personer, 15h
    }
    
    let totalBuildHours = baseHours;
    
    // TV-tillägg: +1h per TV
    totalBuildHours += tvs.length;
    
    // Truss-tillägg: +6h (3×2h för 2 personer, eller 2×3h för 3 personer)
    const selectedTruss = TRUSS_TYPES[selectedTrussType];
    if (selectedTruss.type !== 'none') {
      totalBuildHours += 6;
    }
    
    // Beräkna total arbetstid (personer × timmar)
    const totalPersonHours = persons * totalBuildHours;
    const buildCost = totalPersonHours * 750; // 750 kr per timme
    
    // Rivning: 75% av byggtiden
    const demolitionHours = Math.round(totalBuildHours * 0.75);
    const totalDemolitionPersonHours = persons * demolitionHours;
    const demolitionCost = totalDemolitionPersonHours * 750;
    
    // Skissavgift baserat på storlek
    const adminFee = area <= 25 ? 5000 : 10000; // 5x5 och mindre = 5000kr, större = 10000kr
    
    // Förbrukningsmaterial baserat på monterstorlek
    let consumables = 750; // Små montrar som standard
    if (area <= 25) {
      consumables = 750; // Små montrar (≤5x5)
    } else if (area <= 64) {
      consumables = 1350; // Mellan montrar (5x5 - 8x8)
    } else {
      consumables = 2000; // Stora montrar (>8x8)
    }
    
    return {
      buildHours: totalBuildHours,
      demolitionHours,
      buildCost,
      demolitionCost,
      adminFee,
      consumables,
      persons,
      area: area
    };
  };
  
  // Återställ disk markers när man byter disktyp
  // React.useEffect(() => { 
  //   setCounterMarkersVisible(true); 
  //   setCounters([]);
  // }, [counterType]);

  return (
    <div className="app-container" data-unused={__unused_refs.length} style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#f0f0f0',
      position: 'relative',
      display: 'flex',
      flexDirection: 'row'
    }}>
      
      {/* Mobile Bottom Navigation (endast mobil) */}
      {window.innerWidth <= 768 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '1px solid #e0e0e0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Current Step Content */}
          <div style={{
            padding: '20px',
            maxHeight: '40vh',
            overflowY: 'auto',
            background: '#fafafa'
          }}>
            {mobileStep === 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Välj monterstorlek</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {FLOOR_SIZES.map((floor, index) => (
                    <button
                      key={index}
                      onClick={() => setFloorIndex(index)}
                      style={{
                        padding: '16px',
                        background: floorIndex === index ? '#667eea' : 'white',
                        color: floorIndex === index ? 'white' : '#333',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      {floor.image && <img src={floor.image} alt={floor.label} style={{ width: '32px', height: '32px' }} />}
                      {floor.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mobileStep === 1 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Välj väggform</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {WALL_SHAPES.map((shape) => (
                    <button
                      key={shape.value}
                      onClick={() => setWallShape(shape.value)}
                      style={{
                        padding: '16px',
                        background: wallShape === shape.value ? '#667eea' : 'white',
                        color: wallShape === shape.value ? 'white' : '#333',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      {shape.image && <img src={shape.image} alt={shape.label} style={{ width: '32px', height: '32px' }} />}
                      {shape.label}
                    </button>
                  ))}
                </div>
                
                {wallShape && (
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Väggfärg:</label>
                    <input 
                      type="color" 
                      value={CARPET_COLORS[carpetIndex]?.color || '#ffffff'} 
                      onChange={(e) => {
                        const colorIndex = CARPET_COLORS.findIndex(c => c.color === e.target.value);
                        if (colorIndex >= 0) setCarpetIndex(colorIndex);
                      }}
                      style={{ width: '100%', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            )}
            {mobileStep === 2 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Lägg till möbler</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Välj möbel:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {FURNITURE_TYPES.slice(0, 4).map((furniture, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedFurnitureType(index);
                          setFurnitureMarkersVisible(true);
                        }}
                        style={{
                          padding: '12px',
                          background: selectedFurnitureType === index ? '#667eea' : 'white',
                          color: selectedFurnitureType === index ? 'white' : '#333',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {furniture.label}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setFurnitureMarkersVisible(!furnitureMarkersVisible)}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '16px',
                      background: furnitureMarkersVisible ? '#28a745' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {furnitureMarkersVisible ? '✓ Klicka i 3D-vyn för att placera' : '📍 Aktivera placeringsläge'}
                  </button>
                </div>
                
                <div style={{ fontSize: '13px', color: '#666', marginTop: '12px', padding: '12px', background: '#f0f0f0', borderRadius: '8px' }}>
                  💡 Tryck på möbler i 3D-vyn för att rotera eller ta bort
                </div>
              </div>
            )}
            {mobileStep === 3 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Klar att beställa!</h3>
                <button style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  📧 Skicka beställning
                </button>
              </div>
            )}
          </div>
          
          {/* Bottom Tab Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0',
            background: 'white'
          }}>
            {['📐', '🏢', '🪑', '✅'].map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setMobileStep(idx)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: mobileStep === idx ? '#667eea' : 'transparent',
                  color: mobileStep === idx ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 3D Canvas Container */}
      <div className="canvas-container" style={{
        flex: window.innerWidth <= 768 ? '0.6' : '1',
        position: 'relative',
        background: '#f0f0f0',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        maxHeight: '100vh'
      }}>
      {/* Floating live packlista (always visible) - DOLD */}
      <div id="packlista-floating" style={{ position: 'fixed', left: 340, top: 12, width: 200, padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 1201, display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Packlista</div>
          <button
            aria-label={floatingPacklistCollapsed ? 'Visa packlista' : 'Minimera packlista'}
            title={floatingPacklistCollapsed ? 'Visa' : 'Minimera'}
            onClick={() => setFloatingPacklistCollapsed(!floatingPacklistCollapsed)}
            style={{ width: 26, height: 26, padding: 0, borderRadius: '50%', border: 'none', background: '#007acc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: '18px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', zIndex: 1302 }}
          >{floatingPacklistCollapsed ? '+' : '−'}</button>
        </div>
        {!floatingPacklistCollapsed && (() => {
          const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
          const floorW = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
          const floorD = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
          const pack = computePacklista(wallShape, floorW, floorD, wallHeight, storages);
          // compute visible shelf brackets (the small horizontal brackets under WallShelf)
          // compute SAM-led as total wall length in meters according to wallShape
          const computeSamLedFromWallLength = () => {
            const wallsToSum: Array<'back'|'left'|'right'> = [];
            if (wallShape === 'straight') wallsToSum.push('back');
            else if (wallShape === 'l') { wallsToSum.push('back'); wallsToSum.push('left'); }
            else if (wallShape === 'u') { wallsToSum.push('back'); wallsToSum.push('left'); wallsToSum.push('right'); }
            let sum = 0;
            for (const w of wallsToSum) {
              sum += (w === 'back') ? floorW : floorD;
            }
            return Math.round(sum); // integer number of meters
          };
          const visibleBrackets = computeSamLedFromWallLength();
          const totals = Object.assign({}, pack.totals || {});
          // Ensure disk innehylla from placed counters is visible in floating packlista
          try {
            const diskCount = (counters || []).length * 2;
            if (diskCount > 0) (totals as any)['disk innehylla'] = ((totals as any)['disk innehylla'] || 0) + diskCount;
          } catch (e) {}
          // show SAM-led as number of vertical brackets (one per bracket) only when lights are enabled
          if (visibleBrackets > 0 && showLights) totals['SAM-led'] = visibleBrackets;
          // add carpet info as misc entry when selected
          if (carpetIndex !== 0) {
            const selectedCarpet = CARPET_COLORS[carpetIndex];
            const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
            const floorW = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
            const floorD = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
            (totals as any)['Matta'] = `${floorW}×${floorD} ${selectedCarpet.name}`;
          }
          // add chosen graphic label to totals (e.g. Hyr grafik, Eget tryck (forex), Eget tryck (vepa))
          if (graphic && graphic !== 'none') {
            const g = GRAPHICS.find(gr => gr.value === graphic);
            if (g) (totals as any)['Grafik'] = g.label;
          }
          // When using hyr grafik, add wall-area entries to packlista
          if (graphic === 'hyr') {
            const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
            const fw = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
            const fd = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
            const backArea = Math.round((fw * wallHeight) * 10) / 10;
            const sideArea = Math.round((fd * wallHeight) * 10) / 10;
            if (fw > 0) (totals as any)['Hyrgrafik bakvägg'] = `${backArea} kvm (${fw}m × ${wallHeight}m)`;
            if ((wallShape === 'l' || wallShape === 'u') && fd > 0) (totals as any)['Hyrgrafik vänster vägg'] = `${sideArea} kvm (${fd}m × ${wallHeight}m)`;
            if (wallShape === 'u' && fd > 0) (totals as any)['Hyrgrafik höger vägg'] = `${sideArea} kvm (${fd}m × ${wallHeight}m)`;
          }
          // When using vepa, add wall-area entries to packlista
          if (graphic === 'vepa') {
            const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
            const fw = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
            const fd = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
            const backArea = Math.round((fw * wallHeight) * 10) / 10;
            const sideArea = Math.round((fd * wallHeight) * 10) / 10;
            if (uploadedImage && fw > 0) (totals as any)['Vepa bakvägg'] = `${backArea} kvm (${fw}m × ${wallHeight}m)`;
            if ((wallShape === 'l' || wallShape === 'u') && uploadedImageLeft && fd > 0) (totals as any)['Vepa vänster vägg'] = `${sideArea} kvm (${fd}m × ${wallHeight}m)`;
            if (wallShape === 'u' && uploadedImageRight && fd > 0) (totals as any)['Vepa höger vägg'] = `${sideArea} kvm (${fd}m × ${wallHeight}m)`;
          }
          // add small items (espresso, flower, candy bowl) when selected
          if (showEspressoMachine) totals['Espressomaskin'] = (totals['Espressomaskin'] || 0) + 1;
          if (showFlowerVase) totals['Blomma'] = (totals['Blomma'] || 0) + 1;
          if (showCandyBowl) totals['Godiskål'] = (totals['Godiskål'] || 0) + 1;
          // add TV counts to live totals
          if ((tvs || []).length > 0) {
            const tvCounts: Record<string, number> = {};
            (tvs || []).forEach(tv => {
              const label = TV_SIZES[tv.size]?.label || 'Okänd';
              tvCounts[label] = (tvCounts[label] || 0) + 1;
            });
            Object.keys(tvCounts).forEach(lbl => {
              (totals as any)[`TV ${lbl}`] = ((totals as any)[`TV ${lbl}`] || 0) + tvCounts[lbl];
            });
          }
          // add plant counts to live totals
          if ((plants || []).length > 0) {
            const plantCounts: Record<string, number> = {};
            (plants || []).forEach(p => {
              const label = PLANT_TYPES[p.type]?.label || 'Okänd';
              plantCounts[label] = (plantCounts[label] || 0) + 1;
            });
            Object.keys(plantCounts).forEach(lbl => {
              (totals as any)[lbl] = ((totals as any)[lbl] || 0) + plantCounts[lbl];
            });
          }
          // add wall shelf counts: one hyllplan per shelf and two brackets per shelf
          if ((wallShelves || []).length > 0) {
            const shelfCount = (wallShelves || []).length;
            (totals as any)['Hyllplan'] = ((totals as any)['Hyllplan'] || 0) + shelfCount;
            (totals as any)['Hyllbracket'] = ((totals as any)['Hyllbracket'] || 0) + (shelfCount * 2);
          }
          // add furniture counts to live totals
          if ((furniture || []).length > 0) {
            const furnCounts: Record<string, number> = {};
            (furniture || []).forEach(f => {
              const label = FURNITURE_TYPES[f.type]?.label || 'Okänd';
              furnCounts[label] = (furnCounts[label] || 0) + 1;
            });
            Object.keys(furnCounts).forEach(lbl => {
              (totals as any)[lbl] = ((totals as any)[lbl] || 0) + furnCounts[lbl];
            });
          }
          // add speaker counts: one högtalare and one högtalarstativ per placed speaker
          if ((speakers || []).length > 0) {
            const sCount = (speakers || []).length;
            (totals as any)['Högtalare'] = ((totals as any)['Högtalare'] || 0) + sCount;
            (totals as any)['Högtalarstativ'] = ((totals as any)['Högtalarstativ'] || 0) + sCount;
          }
          // add clothing rack entry when toggled
          if (showClothingRacks) {
            (totals as any)['Klädhängare'] = ((totals as any)['Klädhängare'] || 0) + 1;
          }
          // Add counters/disk parts to live totals (one-to-one with placed counters)
          try {
            (counters || []).forEach((counter) => {
              const cfg = COUNTER_TYPES.find(ct => ct.label === counter.type);
              if (!cfg) return;
              const add = (key: string, n = 1) => { (totals as any)[key] = ((totals as any)[key] || 0) + n; };

              // Helper: increment matching grafik entries for a frame size
              const addGrafik = (frameKey: string, n = 1) => {
                // frameKey expected like 'Bematrix ram 1x1' -> Grafik 1x1
                const m = frameKey.match(/(\d+,?\d*)x(\d+,?\d*)/);
                if (m) {
                  const gx = `${m[1].replace('.', ',')}x${m[2].replace('.', ',')}`;
                  add(`Grafik ${gx}`, n);
                }
              };

              if (cfg.type === 'L' || cfg.type === 'L-mirrored') {
                add('Bematrix ram 0,5x2', 4);
                add('Bematrix ram 1,5x1', 1);
                add('Bematrix ram 1x1', 1);
                add('Barskiva 1,5x0,5', 1);
                add('Barskiva 1x0,5', 1);
                add('Lister forex', 4);
                add('Corners', 3);
                add('M8pin', 10);
                add('Special connector', 4);
                addGrafik('Bematrix ram 0,5x2', 4);
                addGrafik('Bematrix ram 1,5x1', 1);
                addGrafik('Bematrix ram 1x1', 1);
              } else {
                switch (cfg.width) {
                  case 1:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 1x1', 1);
                    add('Barskiva 1x0,5', 1);
                    add('Lister forex', 4);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 1x1', 1);
                    break;
                  case 1.5:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 1,5x1', 1);
                    add('Barskiva 1,5x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 1,5x1', 1);
                    break;
                  case 2:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 2x1', 1);
                    add('Barskiva 2x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 2x1', 1);
                    break;
                  case 2.5:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 2,5x1', 1);
                    add('Barskiva 2,5x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 2,5x1', 1);
                    break;
                  case 3:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 3x1', 1);
                    add('Barskiva 3x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 3x1', 1);
                    break;
                  case 3.5:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 2x1', 1);
                    add('Bematrix ram 1,5x1', 1);
                    add('Connectors', 2);
                    add('Barskiva 3,5x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 2x1', 1);
                    addGrafik('Bematrix ram 1,5x1', 1);
                    break;
                  case 4:
                    add('Bematrix ram 0,5x2', 2);
                    add('Bematrix ram 2x1', 2);
                    add('Connectors', 2);
                    add('Barskiva 4x0,5', 1);
                    add('Lister forex', 4);
                    add('Corners', 2);
                    add('M8pin', 6);
                    add('Special connector', 2);
                    addGrafik('Bematrix ram 0,5x2', 2);
                    addGrafik('Bematrix ram 2x1', 2);
                    break;
                  default:
                    break;
                }
              }
              // Add two disk innehylla per placed disk
              add('disk innehylla', 2);
            });
          } catch (e) {
            // ignore any runtime issues while building live totals
          }
          // Truss BOM for live totals based on selected truss type
          try {
            const sel = TRUSS_TYPES[selectedTrussType];
            if (sel.type === 'hanging-square') {
              // Truss fyrkant: 2m truss x4, vajer x4, trusslampa x4
              (totals as any)['Truss 2m'] = ((totals as any)['Truss 2m'] || 0) + 4;
              (totals as any)['Vajer upphängning'] = ((totals as any)['Vajer upphängning'] || 0) + 4;
              (totals as any)['Trusslampa'] = ((totals as any)['Trusslampa'] || 0) + 4;
            } else if (sel.type === 'hanging-round') {
              // Rund truss: 90deg segments x4, vajer x4, trusslampa x6
              (totals as any)['Truss rund 90grader'] = ((totals as any)['Truss rund 90grader'] || 0) + 4;
              (totals as any)['Vajer upphängning'] = ((totals as any)['Vajer upphängning'] || 0) + 4;
              (totals as any)['Trusslampa'] = ((totals as any)['Trusslampa'] || 0) + 6;
            } else if (sel.type === 'front-straight') {
              // Framkant truss: split into 2m + 1m segments to cover front width
              const frontWidth = floorIndex !== null ? (FLOOR_SIZES[floorIndex].custom ? customFloorWidth : FLOOR_SIZES[floorIndex].width) : 0;
              // prefer 2m segments as many as possible, remainder as 1m
              const twoMeterCount = Math.floor(frontWidth / 2);
              const remainder = frontWidth - (twoMeterCount * 2);
              const oneMeterCount = Math.round(remainder); // either 0 or 1 usually
              if (twoMeterCount > 0) (totals as any)['Truss 2m'] = ((totals as any)['Truss 2m'] || 0) + twoMeterCount;
              if (oneMeterCount > 0) (totals as any)['Truss 1m'] = ((totals as any)['Truss 1m'] || 0) + oneMeterCount;
              (totals as any)['Vajer upphängning'] = ((totals as any)['Vajer upphängning'] || 0) + 4;
              // trusslampor: 1 per meter
              const lampCount = Math.round(frontWidth);
              if (lampCount > 0) (totals as any)['Trusslampa'] = ((totals as any)['Trusslampa'] || 0) + lampCount;
            }
          } catch (e) {
            // ignore
          }
          // Counters: (removed) disk-related packlist augmentation handled elsewhere; kept UI clean
          const frameKeys = Object.keys(totals).filter(k => k.includes('x')).sort();
          const miscKeys = Object.keys(totals).filter(k => !k.includes('x') && k !== 'SAM-led').sort();
          if (frameKeys.length === 0 && miscKeys.length === 0) return <div style={{ fontSize: 12, color: '#666' }}>Inga ramar</div>;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {frameKeys.map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ color: '#222' }}>{k.replace('.', ',')}</div>
                  <div style={{ color: '#007acc', fontWeight: 700 }}>{(totals as any)[k]}st</div>
                </div>
              ))}
              {miscKeys.map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ color: '#444' }}>{k.replace('_', ' ')}</div>
                  <div style={{ color: '#007acc', fontWeight: 700 }}>{(totals as any)[k]}</div>
                </div>
              ))}
              {/* show SAM-led as misc key if present */}
              {totals['SAM-led'] ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ color: '#444' }}>SAM-led</div>
                  <div style={{ color: '#007acc', fontWeight: 700 }}>{totals['SAM-led']}st</div>
                </div>
              ) : null}
              {/* per-storage breakdown */}
              {([].concat(...Object.keys(pack.perWall || {}).map(k => (pack.perWall[k].storages || []))) || []).map((s: any) => (
                <div key={s.id || Math.random()} style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                  Förråd {s.id ?? ''}: {s.width}x{s.depth} {s.cornerPlacement ? '(hörn)' : ''}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Floating price box (separate from main interface) - DOLD */}
      <div id="price-floating" style={{ position: 'fixed', left: 560, top: 12, width: 280, padding: 12, background: '#fff', border: '2px solid #007acc', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1200, display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#007acc', display: 'flex', alignItems: 'center', gap: 6 }}>
            💰 Prissamanställning
          </div>
          <button
            aria-label={floatingPriceCollapsed ? 'Visa prissamanställning' : 'Minimera prissamanställning'}
            title={floatingPriceCollapsed ? 'Visa' : 'Minimera'}
            onClick={() => setFloatingPriceCollapsed(!floatingPriceCollapsed)}
            style={{ width: 28, height: 28, padding: 0, borderRadius: '50%', border: 'none', background: '#007acc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: '20px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >{floatingPriceCollapsed ? '+' : '−'}</button>
        </div>
        {!floatingPriceCollapsed && floorIndex !== null && (() => {
          const materialCost = calculatePrice();
          const laborCosts = calculateLaborCosts();
          const subtotal = materialCost + laborCosts.buildCost + laborCosts.demolitionCost + laborCosts.adminFee + laborCosts.consumables;
          const markup = Math.round(subtotal * 0.15);
          const totalCost = subtotal + markup;
          
          return (
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              {/* Material & uthyrning */}
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Material & uthyrning:</span>
                <span style={{ fontWeight: 600 }}>{materialCost.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Uppsättning */}
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Uppsättning ({laborCosts.persons} pers × {laborCosts.buildHours}h):</span>
                <span style={{ fontWeight: 600 }}>{laborCosts.buildCost.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Nedmontering */}
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Nedmontering ({laborCosts.persons} pers × {laborCosts.demolitionHours}h):</span>
                <span style={{ fontWeight: 600 }}>{laborCosts.demolitionCost.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Förbrukningsmaterial */}
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Förbrukningsmaterial:</span>
                <span style={{ fontWeight: 600 }}>{laborCosts.consumables.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Skissavgift */}
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Skissavgift:</span>
                <span style={{ fontWeight: 600 }}>{laborCosts.adminFee.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Subtotal */}
              <div style={{ marginBottom: 8, paddingTop: 8, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Subtotal:</span>
                <span style={{ fontWeight: 700 }}>{subtotal.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Projektledning */}
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Projektledning (15%):</span>
                <span style={{ fontWeight: 600 }}>{markup.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Total */}
              <div style={{ 
                paddingTop: 10, 
                borderTop: '2px solid #007acc', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#007acc' }}>TOTALT:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#28a745' }}>{totalCost.toLocaleString('sv-SE')} kr</span>
              </div>
              
              {/* Footer note */}
              <div style={{ marginTop: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>
                Priser exkl. moms
              </div>
            </div>
          );
        })()}
        {floorIndex === null && !floatingPriceCollapsed && (
          <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '12px 0' }}>
            Välj en monterstorlek för att se prissamanställning
          </div>
        )}
      </div>

      {/* Sidopanel (endast desktop) */}
      {window.innerWidth > 768 && (
      <div className="controls-container" style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '320px',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #f8fbff 0%, #e8f4fd 100%)',
        backdropFilter: 'blur(12px)',
        borderRight: '2px solid #e1e8ed',
        boxShadow: '8px 0 32px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        paddingBottom: 56,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        fontSize: '14px'
      }}>
        
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          margin: '-24px -24px 24px -24px',
          padding: '20px 24px',
          borderRadius: '0 0 12px 12px',
          zIndex: 10
        }}>
          <h2 style={{
            fontWeight: 700, 
            fontSize: window.innerWidth <= 768 ? '18px' : '20px', 
            margin: 0,
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>🏗️ Monterval</h2>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Monterstorlek:</label>
          
          <CustomDropdown
            options={FLOOR_SIZES.filter(floor => floor.custom).map((floor, _index) => ({ ...floor, value: FLOOR_SIZES.length - 1 }))}
            value={floorIndex ?? ''}
            onChange={(value) => setFloorIndex(value === '' ? null : Number(value))}
            placeholder="Anpassad storlek"
            renderOption={(option) => (
              <>
                {option.image ? (
                  <img 
                    src={option.image} 
                    alt={option.label}
                    style={{
                      width: '24px',
                      height: '24px',
                      objectFit: 'contain',
                      marginRight: '8px'
                    }}
                  />
                ) : (
                  <span style={{ 
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    marginRight: '8px',
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    {option.value === '' ? '—' : '📐'}
                  </span>
                )}
                {option.label}
              </>
            )}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Anpassad storlek input-fält */}
        {floorIndex !== null && FLOOR_SIZES[floorIndex]?.custom && (
          <div style={{marginTop: '10px'}}>
            {/* Bredd och djup fält */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginTop: '12px',
              padding: '16px',
              backgroundColor: '#f8fbff',
              borderRadius: '8px',
              border: '2px solid #e8f4fd'
            }}>
              <div>
                <label style={{ 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  color: '#2c3e50',
                  marginBottom: '6px',
                  display: 'block'
                }}>Bredd:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={customFloorWidth} 
                    onChange={e => setCustomFloorWidth(Math.max(1, Math.min(15, parseFloat(e.target.value) || 1)))}
                    step="0.5"
                    min="1"
                    max="15"
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: 'white',
                      color: '#2c3e50',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3498db';
                      e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e8ed';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#7f8c8d' }}>m</span>
                </div>
              </div>
              
              <div>
                <label style={{ 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  color: '#2c3e50',
                  marginBottom: '6px',
                  display: 'block'
                }}>Djup:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={customFloorDepth} 
                    onChange={e => setCustomFloorDepth(Math.max(1, Math.min(15, parseFloat(e.target.value) || 1)))}
                    step="0.5"
                    min="1" 
                    max="15"
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: 'white',
                      color: '#2c3e50',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3498db';
                      e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e8ed';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#7f8c8d' }}>m</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {floorIndex !== null && <>
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Matta/färg:</label>
          
          <CustomDropdown
            options={CARPET_COLORS.map((color, index) => ({ ...color, value: index }))}
            value={carpetIndex}
            onChange={(value) => setCarpetIndex(value)}
            placeholder="Välj mattfärg"
            renderOption={(option) => (
              <>
                {option.color === null ? (
                  <>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '20px', 
                      height: '20px', 
                      marginRight: '8px',
                      fontSize: '16px'
                    }}>❌</span>
                    {option.name}
                  </>
                ) : option.color?.startsWith('checkerboard') ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '8px',
                      background: option.color === 'checkerboard-bw' 
                        ? 'repeating-conic-gradient(#000 0deg 90deg, #fff 90deg 180deg)'
                        : option.color === 'checkerboard-rb'
                        ? 'repeating-conic-gradient(#e74c3c 0deg 90deg, #000 90deg 180deg)'
                        : option.color === 'checkerboard-bwhite'
                        ? 'repeating-conic-gradient(#3498db 0deg 90deg, #fff 90deg 180deg)'
                        : 'repeating-conic-gradient(#f1c40f 0deg 90deg, #000 90deg 180deg)',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }} />
                    {option.name}
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '8px',
                      backgroundColor: option.color,
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }} />
                    {option.name}
                  </>
                )}
              </>
            )}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Bakväggsform:</label>
          
          <CustomDropdown
            options={WALL_SHAPES}
            value={wallShape}
            onChange={(value) => setWallShape(value)}
            placeholder="Välj väggform"
            renderOption={(option) => (
              <>
                {option.image ? (
                  <img 
                    src={option.image} 
                    alt={option.label}
                    style={{
                      width: '32px',
                      height: '24px',
                      objectFit: 'contain',
                      marginRight: '8px'
                    }}
                  />
                ) : (
                  <span style={{ 
                    display: 'inline-block',
                    width: '32px',
                    height: '24px',
                    marginRight: '8px',
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    —
                  </span>
                )}
                {option.label}
              </>
            )}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Vägg-höjd:</label>
          
          <CustomDropdown
            options={WALL_HEIGHTS}
            value={wallHeight}
            onChange={(value) => setWallHeight(value)}
            placeholder="Välj höjd"
            renderOption={(option) => (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  textAlign: 'center',
                  lineHeight: '24px',
                  fontSize: '16px',
                  color: '#666'
                }}>
                  📏
                </span>
                {option.label}
              </>
            )}
            style={{ width: '100%' }}
          />
        </div>
        {/* Lampor: flyttad placering i menyn - ligger nu ovanför Grafik */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#f8fbff',
          borderRadius: '8px',
          border: '2px solid #e8f4fd',
          minHeight: '60px',
          overflow: 'visible',
          position: 'relative'
        }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'block'
          }}>Lampor:</label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '12px',
            padding: '12px 0',
            margin: 0,
            width: '100%'
          }}>
            <input 
              type="checkbox" 
              checked={showLights} 
              onChange={e => setShowLights(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                margin: 0,
                cursor: 'pointer',
                accentColor: '#3498db',
                flexShrink: 0
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#2c3e50',
              userSelect: 'none',
              flex: 1
            }}>SAM-LED</span>
          </label>
        </div>
        {/* Gamla upload-knappar - nu ersatta av VepaPDFGenerator */}
        {graphic === 'vepa' && false && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ 
              fontWeight: 600, 
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '8px',
              display: 'block'
            }}>Ladda upp egen bild för bakvägg:</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setUploadedImage(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ 
                fontSize: '14px', 
                marginBottom: '8px',
                padding: '8px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                width: '100%',
                background: 'white'
              }}
            />
            {uploadedImage && (
              <div style={{ fontSize: 12, color: '#666' }}>✓ Bakväggsbild uppladdad</div>
            )}
            
            {(wallShape === 'l' || wallShape === 'u') && (
              <>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', marginTop: 16 }}>Ladda upp egen bild för vänster vägg:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setUploadedImageLeft(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: 12, marginBottom: 8 }}
                />
                {uploadedImageLeft && (
                  <div style={{ fontSize: 12, color: '#666' }}>✓ Vänster väggbild uppladdad</div>
                )}
              </>
            )}
            
            {wallShape === 'u' && (
              <>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', marginTop: 16 }}>Ladda upp egen bild för höger vägg:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setUploadedImageRight(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: 12, marginBottom: 8 }}
                />
                {uploadedImageRight && (
                  <div style={{ fontSize: 12, color: '#666' }}>✓ Höger väggbild uppladdad</div>
                )}
              </>
            )}
          </div>
        )}
        {/* GAMMAL FOREX BILDUPPLADDNING - DOLD, använd nu ForexPDFGenerator istället */}
        {false && graphic === 'forex' && (
          <div>
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Ladda upp egen bild för bakvägg (forex med silvriga lister):</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setForexImageBack(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ fontSize: 12, marginBottom: 8 }}
            />
            {forexImageBack && (
              <div style={{ fontSize: 12, color: '#666' }}>✓ Forex bakväggsbild uppladdad</div>
            )}
            
            {(wallShape === 'l' || wallShape === 'u') && (
              <>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', marginTop: 16 }}>Ladda upp egen bild för vänster vägg (forex):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForexImageLeft(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: 12, marginBottom: 8 }}
                />
                {forexImageLeft && (
                  <div style={{ fontSize: 12, color: '#666' }}>✓ Forex vänster väggbild uppladdad</div>
                )}
              </>
            )}
            
            {wallShape === 'u' && (
              <>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', marginTop: 16 }}>Ladda upp egen bild för höger vägg (forex):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForexImageRight(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: 12, marginBottom: 8 }}
                />
                {forexImageRight && (
                  <div style={{ fontSize: 12, color: '#666' }}>✓ Forex höger väggbild uppladdad</div>
                )}
              </>
            )}
          </div>
        )}
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Grafik:</label>
          
          <CustomDropdown
            options={GRAPHICS}
            value={graphic}
            onChange={(value) => setGraphic(value)}
            placeholder="Välj grafik"
            renderOption={(option) => (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  textAlign: 'center',
                  lineHeight: '24px',
                  fontSize: '16px',
                  color: '#666'
                }}>
                  🎨
                </span>
                {option.label}
              </>
            )}
            style={{ width: '100%' }}
          />
          
          {/* VEPA PDF Generator knapp */}
          {graphic === 'vepa' && wallShape && wallShape !== '' && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => setShowVepaPDFGenerator(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#45a049';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span>🎨</span>
                <span>Skapa VEPA tryckfiler</span>
              </button>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Designa och ladda ner print-ready PDF:er
              </div>
            </div>
          )}
          
          {/* Forex PDF Generator knapp */}
          {graphic === 'forex' && wallShape && wallShape !== '' && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => setShowForexPDFGenerator(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FF9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F57C00';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF9800';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span>🖼️</span>
                <span>Skapa FOREX tryckfiler</span>
              </button>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Rambaserade Forex-skyltar med skärstreck
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '8px',
            display: 'block'
          }}>Diskar:</label>
          
          <InstructionCard
            icon="🟢"
            title="Hantera diskar"
            description="Välj disktyp och placera dem genom att klicka på gröna rutor. Klicka på placerad disk för att rotera."
            type="success"
          />
          
          {counters.length > 0 && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              Placerade diskar: {counters.length}
              <button
                style={{marginLeft:12, padding:'4px 12px', fontWeight:600, background:'#ff4444', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                onClick={() => setCounters([])}
              >Rensa alla</button>
            </div>
          )}
          {/* Markörkontroller - visa alltid när väggar finns */}
          {wallShape && wallShape !== '' && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              {counterMarkersVisible ? (
                <>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block', marginBottom:4, fontWeight:600}}>Välj disktyp:</label>
                    <CustomDropdown
                      options={COUNTER_TYPES.slice(1).map((counter, index) => ({ ...counter, value: index + 1 }))}
                      value={selectedCounterType}
                      onChange={(value) => setSelectedCounterType(value)}
                      placeholder="Välj disktyp"
                      renderOption={(option) => (
                        <>
                          {option.image ? (
                            <img 
                              src={option.image} 
                              alt={option.label}
                              style={{
                                width: '32px',
                                height: '24px',
                                objectFit: 'contain',
                                marginRight: '8px'
                              }}
                            />
                          ) : (
                            <span style={{ 
                              display: 'inline-block',
                              width: '32px',
                              height: '24px',
                              marginRight: '8px',
                              textAlign: 'center',
                              lineHeight: '24px',
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              📦
                            </span>
                          )}
                          {option.label}
                        </>
                      )}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{display:'flex', gap: 8, marginTop: 8}}>
                    <button
                      style={{flex:1, padding:'6px 18px', fontWeight:600, background:'#1ec94c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:15}}
                      onClick={() => setCounterMarkersVisible(false)}
                    >OK</button>
                    <button
                      style={{flex:1, padding:'6px 18px', fontWeight:600, background:'#ec4899', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13}}
                      onClick={() => setShowCounterPDFGenerator(true)}
                      title="Öppna avancerad diskdesigner"
                    >🎨 Designer</button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    style={{padding:'8px 16px', fontWeight:600, background:'#007acc', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, marginTop:8}}
                    onClick={() => setCounterMarkersVisible(true)}
                  >Lägg till disk</button>
                </>
              )}
            </div>
          )}
          
          {/* Diskobjekt-kontroller */}
          <div style={{ 
            marginTop: 12, 
            padding: '12px', 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <label style={{ fontWeight: 600, marginRight: 8, fontSize: 14 }}>Objekt på diskar:</label>
            
            <InstructionCard
              icon="✨"
              title="Smart objektplacering"
              description="Välj vilka objekt som ska visas på dina diskar."
              type="info"
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input 
                  type="checkbox" 
                  checked={showEspressoMachine} 
                  onChange={(e) => setShowEspressoMachine(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                ☕ Espressomaskin
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input 
                  type="checkbox" 
                  checked={showFlowerVase} 
                  onChange={(e) => setShowFlowerVase(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                🌸 Vas med blomma
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input 
                  type="checkbox" 
                  checked={showCandyBowl} 
                  onChange={(e) => setShowCandyBowl(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                🍬 Godiskål
              </label>
            </div>
          </div>
        </div>
        {wallShape && wallShape !== '' && (
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>TV-apparater:</label>
            
            <InstructionCard
              icon="📺"
              title="Hantera TV-apparater"
              description="Välj TV-storlek och placera dem på väggarna. Dubbelklicka för att växla mellan liggande och stående format."
              type="info"
            />
            
            {tvs.length > 0 && (
              <div style={{fontSize:12, color:'#888', marginTop:8}}>
                Placerade TV:ar: {tvs.length}
                <button
                  style={{marginLeft:12, padding:'4px 12px', fontWeight:600, background:'#ff4444', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                  onClick={() => setTvs([])}
                >Rensa alla</button>
              </div>
            )}
            
            {/* TV-kontroller */}
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              {tvMarkersVisible ? (
                <>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block', marginBottom:4, fontWeight:600}}>Välj TV-storlek:</label>
                    <CustomDropdown
                      options={TV_SIZES.map((tv, index) => ({ ...tv, value: index }))}
                      value={selectedTvSize}
                      onChange={(value) => setSelectedTvSize(value)}
                      placeholder="Välj TV-storlek"
                      renderOption={(option) => (
                        <>
                          {option.image ? (
                            <img 
                              src={option.image} 
                              alt={option.label}
                              style={{
                                width: '32px',
                                height: '20px',
                                objectFit: 'contain',
                                marginRight: '8px'
                              }}
                            />
                          ) : (
                            <span style={{ 
                              display: 'inline-block',
                              width: '32px',
                              height: '20px',
                              marginRight: '8px',
                              textAlign: 'center',
                              lineHeight: '20px',
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              📺
                            </span>
                          )}
                          {option.label}
                        </>
                      )}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  {/* Höjd-information */}
                  <div style={{
                    marginBottom: 12,
                    padding: 8,
                    background: '#f8f9fa',
                    borderRadius: 4,
                    fontSize: 11
                  }}>
                    <div style={{fontWeight: 600, marginBottom: 4, color: '#333'}}>📏 TV-höjder:</div>
                    <div style={{color: '#666', lineHeight: 1.4}}>
                      <span style={{color: '#4CAF50', fontWeight: 600}}>H</span> = Hög position (presentationsskärmar)<br/>
                      <span style={{color: '#4CAF50', fontWeight: 600}}>M</span> = Mellan position (allmän viewing)
                    </div>
                  </div>
                  
                  <button
                    style={{padding:'6px 18px', fontWeight:600, background:'#1ec94c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:15}}
                    onClick={() => setTvMarkersVisible(false)}
                  >OK</button>
                </>
              ) : (
                <>
                  <button
                    style={{padding:'8px 16px', fontWeight:600, background:'#007acc', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, marginTop:8}}
                    onClick={() => setTvMarkersVisible(true)}
                  >Lägg till TV</button>
                </>
              )}
            </div>

            {/* Truss-kontroller */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600, marginRight: 8 }}>Truss-strukturer:</label>
              
              <InstructionCard
                icon="🔩"
                title="Välj truss-strukturer"
                description="Framkant: Rak truss längs framkanten. Hängande: Rund eller fyrkantig struktur i mitten."
                type="warning"
              />
              
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Välj truss-typ:</label>
                <CustomDropdown
                  options={TRUSS_TYPES.map((truss, index) => ({ ...truss, value: index }))}
                  value={selectedTrussType}
                  onChange={(value) => {
                    console.log('Truss type changed to:', value, 'type:', TRUSS_TYPES[value]?.type);
                    setSelectedTrussType(value);
                  }}
                  placeholder="Välj truss-typ"
                  // iconBefore="🔩"  // Property removed - not supported
                  renderOption={(option) => (
                    <>
                      {option.image ? (
                        <img
                          src={option.image}
                          alt={option.label}
                          style={{
                            width: '24px',
                            height: '24px',
                            objectFit: 'contain',
                            marginRight: '8px'
                          }}
                        />
                      ) : (
                        <span style={{
                          fontSize: '16px',
                          marginRight: '8px',
                          display: 'inline-block',
                          width: '24px',
                          textAlign: 'center'
                        }}>
                          {option.type === 'none' ? '❌' :
                           option.type === 'front-straight' ? '📐' :
                           option.type === 'hanging-round' ? '⭕' : '⬜'}
                        </span>
                      )}
                      {option.label}
                    </>
                  )}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

          </div>
        )}
        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>Förråd:</label>
          
          <InstructionCard
            icon="📦"
            title="Hantera förråd"
            description="Klicka på gröna rutor för att välja förråd-storlek och placera. Klicka på placerat förråd för att rotera det 90° åt gången."
            type="warning"
          />
          
          {storages.length > 0 && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              Placerade förråd: {storages.length}
              <button
                style={{marginLeft:12, padding:'4px 12px', fontWeight:600, background:'#ff4444', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                onClick={() => setStorages([])}
              >Rensa alla</button>
            </div>
          )}
          
          {/* Förrådskontroller */}
          {wallShape && wallShape !== '' && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              {storageMarkersVisible ? (
                <>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block', marginBottom:4, fontWeight:600}}>Välj förråd-storlek:</label>
                    <CustomDropdown
                      options={STORAGE_TYPES.slice(1).map((storage, index) => ({ ...storage, value: index + 1 }))}
                      value={selectedStorageType}
                      onChange={setSelectedStorageType}
                      placeholder="Välj förråd-storlek"
                      // iconBefore="📦"  // Property removed - not supported
                      renderOption={(option) => (
                        <>
                          <span style={{ 
                            fontSize: '16px', 
                            marginRight: '8px',
                            display: 'inline-block',
                            width: '24px',
                            textAlign: 'center'
                          }}>
                            📦
                          </span>
                          {option.label}
                        </>
                      )}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <span>Klicka på blå rutor för att placera förråd. </span>
                  <button
                    style={{padding:'6px 18px', fontWeight:600, background:'#1ec94c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:15}}
                    onClick={() => setStorageMarkersVisible(false)}
                  >OK</button>
                </>
              ) : (
                <>
                  <button
                    style={{padding:'8px 16px', fontWeight:600, background:'#007acc', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, marginTop:8}}
                    onClick={() => setStorageMarkersVisible(true)}
                  >Lägg till förråd</button>
                </>
              )}
            </div>
          )}
        </div>
        {/* Förrådsinställningar för färg och grafik - DÖLJES */}
        {false && wallShape && wallShape !== '' && storages.length > 0 && (
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Förrådens utseende:</label>
            
            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Färg på förråd:</label>
              <input
                type="color"
                value={storageColor}
                onChange={(e) => setStorageColor(e.target.value)}
                style={{ width: '100%', height: 30, border: '1px solid #ccc', borderRadius: 4 }}
              />
            </div>

            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Grafik på förråd:</label>
              <select 
                value={storageGraphic} 
                onChange={e => setStorageGraphic(e.target.value)}
                style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccs'}}
              >
                <option value="none">Ingen grafik</option>
                <option value="upload">Ladda upp egen bild</option>
              </select>
            </div>
          </div>
        )}

        {/* Bildkontroller för förråd - visas alltid när vi har förråd och valt 'ladda upp' - DÖLJES */}
        {false && storages.length > 0 && storageGraphic === 'upload' && (
          <div style={{marginTop:16}}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Förrådbilder:</label>
            
            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Välj vilka väggar som ska ha bilden:</label>
              
              <div style={{marginBottom:4}}>
                <label style={{display:'flex', alignItems:'center', fontSize:14}}>
                  <input 
                    type="checkbox" 
                    checked={storageWallSelections.back}
                    onChange={e => setStorageWallSelections(prev => ({...prev, back: e.target.checked}))}
                    style={{marginRight:8}}
                  />
                  Bakvägg (vägg mot publiken)
                </label>
              </div>
              
              <div style={{marginBottom:4}}>
                <label style={{display:'flex', alignItems:'center', fontSize:14}}>
                  <input 
                    type="checkbox" 
                    checked={storageWallSelections.left}
                    onChange={e => setStorageWallSelections(prev => ({...prev, left: e.target.checked}))}
                    style={{marginRight:8}}
                  />
                  Vänster vägg
                </label>
              </div>
              
              <div style={{marginBottom:4}}>
                <label style={{display:'flex', alignItems:'center', fontSize:14}}>
                  <input 
                    type="checkbox" 
                    checked={storageWallSelections.right}
                    onChange={e => setStorageWallSelections(prev => ({...prev, right: e.target.checked}))}
                    style={{marginRight:8}}
                  />
                  Höger vägg
                </label>
              </div>
              
              <div style={{marginBottom:8}}>
                <label style={{display:'flex', alignItems:'center', fontSize:14}}>
                  <input 
                    type="checkbox" 
                    checked={storageWallSelections.front}
                    onChange={e => setStorageWallSelections(prev => ({...prev, front: e.target.checked}))}
                    style={{marginRight:8}}
                  />
                  Framvägg (öppning mot montern)
                </label>
              </div>
            </div>
            
            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Ladda upp bild för förråd:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setStorageUploadedImage(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ fontSize: 12, marginBottom: 8, width: '100%' }}
              />
              {storageUploadedImage && (
                <div style={{ fontSize: 12, color: '#666' }}>✓ Förrådsbild uppladdad</div>
              )}
            </div>
          </div>
        )}
        
        {/* VEPA/Forex Designer för individuella förråd */}
        {storages.length > 0 && (
          <div style={{marginTop:16}}>
            <label style={{ 
              fontWeight: 600, 
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '8px',
              display: 'block'
            }}>Design förråd:</label>
            
            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:'12px'}}>
              {storages.map(storage => {
                const storageConfig = STORAGE_TYPES[storage.type];
                const freeWalls = calculateFreeStorageWalls(storage);
                const freeWallCount = Object.values(freeWalls).filter(Boolean).length;
                const hasDesign = storageDesigns.has(storage.id);
                
                return (
                  <div key={storage.id} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      Förråd #{storage.id} ({storageConfig.label}) - {freeWallCount} fria väggar
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedStorageForDesign(storage.id);
                        setShowStoragePDFGenerator(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: hasDesign ? '#10b981' : '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hasDesign ? '#059669' : '#2563eb';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = hasDesign ? '#10b981' : '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      <span>{hasDesign ? '✅' : '🎨'}</span>
                      <span>{hasDesign ? 'Redigera design' : 'Skapa design'}</span>
                    </button>
                    
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      {hasDesign ? 'Klicka för att redigera befintlig design' : 'Designa och ladda ner print-ready PDF:er'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Diskinställningar för panelfärger */}
        {wallShape && wallShape !== '' && counters.length > 0 && (
          <div style={{marginTop:16}}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Diskars utseende:</label>
            
            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Färg på paneler (framsida + sidor):</label>
              <input
                type="color"
                value={counterPanelColor}
                onChange={(e) => setCounterPanelColor(e.target.value)}
                style={{ width: '100%', height: 30, border: '1px solid #ccc', borderRadius: 4 }}
              />
            </div>
          </div>
        )}

        {/* Bildkontroller för diskar - visas alltid när vi har diskar */}
        {counters.length > 0 && (
          <div style={{marginTop:16}}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Diskbilder:</label>
            
            <div style={{marginTop:8}}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Eget tryck på framsida:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageData = event.target?.result as string;
                      setCounterFrontImage(imageData);
                      
                      // Om det inte finns några diskar än, skapa automatiskt en standarddisk
                      if (counters.length === 0 && floorIndex !== null) {
                        const counterConfig = COUNTER_TYPES[selectedCounterType];
                        const floor = FLOOR_SIZES[floorIndex];
                        
                        // Placera disken i mitten av golvet
                        const centerX = 0;
                        const centerZ = 0;
                        
                        // Kontrollera att disken passar inom monterområdet
                        let canPlace = true;
                        if (counterConfig.type === 'L' || counterConfig.type === 'L-mirrored') {
                          // L-formad disk: kontrollera både delar
                          const maxX = floor.width / 2;
                          const minX = -floor.width / 2;
                          const maxZ = floor.depth / 2;
                          const minZ = -floor.depth / 2;
                          
                          // Kontrollera första delen (1,5m x 0,5m)
                          if (centerX + 0.75 > maxX || centerX - 0.75 < minX || 
                              centerZ + 0.25 > maxZ || centerZ - 0.25 < minZ) {
                            canPlace = false;
                          }
                          
                          // Kontrollera andra delen beroende på typ
                          if (counterConfig.type === 'L') {
                            // Vanlig L: andra delen åt höger
                            if (centerX + 1.25 > maxX || centerZ + 0.75 > maxZ || centerZ - 0.75 < minZ) {
                              canPlace = false;
                            }
                          } else {
                            // Spegelvänd L: andra delen åt vänster
                            if (centerX - 1.25 < minX || centerZ + 0.75 > maxZ || centerZ - 0.75 < minZ) {
                              canPlace = false;
                            }
                          }
                        } else {
                          // Rektangulär disk
                          const maxX = floor.width / 2;
                          const minX = -floor.width / 2;
                          const maxZ = floor.depth / 2;
                          const minZ = -floor.depth / 2;
                          
                          if (centerX + counterConfig.width/2 > maxX || centerX - counterConfig.width/2 < minX ||
                              centerZ + counterConfig.depth/2 > maxZ || centerZ - counterConfig.depth/2 < minZ) {
                            canPlace = false;
                          }
                        }
                        
                        if (canPlace) {
                          const newCounter = {
                            id: Date.now(),
                            type: COUNTER_TYPES[selectedCounterType].label,
                            position: { x: centerX, z: centerZ },
                            rotation: 0
                          };
                          setCounters(prev => [...prev, newCounter]);
                        }
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ width: '100%', padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
              />
              {counterFrontImage && (
                <div style={{marginTop: 4}}>
                  <button
                    onClick={() => setCounterFrontImage(null)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Ta bort bild
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>Växter:</label>
          
          <InstructionCard
            icon="�"
            title="Hantera växter"
            description="Välj växttyp och placera dem genom att klicka på gröna rutor. Klicka på placerad växt för att rotera."
            type="success"
          />
          
          {plants.length > 0 && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              Placerade växter: {plants.length}
              <button
                style={{marginLeft:12, padding:'4px 12px', fontWeight:600, background:'#ff4444', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                onClick={() => setPlants([])}
              >Rensa alla</button>
            </div>
          )}
          
          {/* Växtkontroller */}
          {wallShape && wallShape !== '' && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              {plantMarkersVisible ? (
                <>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block', marginBottom:4, fontWeight:600}}>Välj växttyp:</label>
                    <CustomDropdown
                      options={PLANT_TYPES.map((plant, index) => ({ ...plant, value: index }))}
                      value={selectedPlantType}
                      onChange={(value) => setSelectedPlantType(value)}
                      placeholder="Välj växt"
                      renderOption={(option) => (
                        <>
                          {option.image ? (
                            <img 
                              src={option.image} 
                              alt={option.label}
                              style={{
                                width: '24px',
                                height: '24px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                marginRight: '8px'
                              }}
                            />
                          ) : (
                            <span style={{ 
                              fontSize: '20px', 
                              marginRight: '8px',
                              display: 'inline-block',
                              width: '24px',
                              textAlign: 'center'
                            }}>
                              {option.emoji}
                            </span>
                          )}
                          {option.label}
                        </>
                      )}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <button
                    style={{padding:'6px 18px', fontWeight:600, background:'#1ec94c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:15}}
                    onClick={() => setPlantMarkersVisible(false)}
                  >OK</button>
                </>
              ) : (
                <>
                  <button
                    style={{padding:'8px 16px', fontWeight:600, background:'#228B22', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, marginTop:8}}
                    onClick={() => setPlantMarkersVisible(true)}
                  >Lägg till växter</button>
                </>
              )}
            </div>
          )}
        </div>
        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>Möbler:</label>
          
          <InstructionCard
            icon="🪑"
            title="Hantera möbler"
            description="Klicka på blåa rutor för att välja möbeltyp och placera. Klicka på placerad möbel för att rotera den 90° åt gången."
            type="info"
          />
          
          {furniture.length > 0 && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              Placerade möbler: {furniture.length}
              <button
                style={{marginLeft:12, padding:'4px 12px', fontWeight:600, background:'#ff4444', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                onClick={() => setFurniture([])}
              >Rensa alla</button>
            </div>
          )}
          
          {/* Möbelkontroller */}
          {wallShape && wallShape !== '' && (
            <div style={{fontSize:12, color:'#888', marginTop:8}}>
              {furnitureMarkersVisible ? (
                <>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block', marginBottom:4, fontWeight:600}}>Välj möbeltyp:</label>
                    <CustomDropdown
                      options={FURNITURE_TYPES.map((furniture, index) => ({ ...furniture, value: index }))}
                      value={selectedFurnitureType}
                      onChange={(value) => setSelectedFurnitureType(value)}
                      placeholder="Välj möbel"
                      renderOption={(option) => (
                        <>
                          {option.image ? (
                            <img 
                              src={option.image} 
                              alt={option.label}
                              style={{
                                width: '24px',
                                height: '24px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                marginRight: '8px'
                              }}
                            />
                          ) : (
                            <span style={{ 
                              fontSize: '20px', 
                              marginRight: '8px',
                              display: 'inline-block',
                              width: '24px',
                              textAlign: 'center'
                            }}>
                              {option.emoji}
                            </span>
                          )}
                          {option.label}
                        </>
                      )}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <button
                    style={{padding:'6px 18px', fontWeight:600, background:'#1ec94c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:15}}
                    onClick={() => setFurnitureMarkersVisible(false)}
                  >OK</button>
                </>
              ) : (
                <>
                  <button
                    style={{padding:'8px 16px', fontWeight:600, background:'#8B4513', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, marginTop:8}}
                    onClick={() => setFurnitureMarkersVisible(true)}
                  >Lägg till möbler</button>
                </>
              )}
            </div>
          )}
          
          {/* Visa placerade möbler */}
          {furniture.length > 0 && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              Placerade möbler: {furniture.length}
              <button
                style={{ marginLeft: 12, padding: '2px 8px', fontSize: 11, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                onClick={() => setFurniture([])}
              >Rensa alla</button>
            </div>
          )}
        </div>
        {wallShape && wallShape !== '' && (
          <>
            
            {/* Nya funktioner */}
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Väggdekorationer & Tillbehör</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
                {/* Hyllor på vägg */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🗄️ Hyllor på vägg
                  </label>
                  
                  <InstructionCard
                    icon="📚"
                    title="Placera hyllor"
                    description="Klicka på väggarna för att placera hyllor (4 per kvm)"
                    type="info"
                  />
                  
                  {wallShelves.length > 0 && (
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                      Placerade hyllor: {wallShelves.length}
                      <button
                        style={{ marginLeft: 12, padding: '2px 8px', fontSize: 11, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                        onClick={() => setWallShelves([])}
                      >Rensa</button>
                    </div>
                  )}
                  {shelfMarkersVisible ? (
                    <button
                      style={{ padding: '4px 12px', fontSize: 12, background: '#1ec94c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      onClick={() => setShelfMarkersVisible(false)}
                    >OK</button>
                  ) : (
                    <button
                      style={{ padding: '4px 12px', fontSize: 12, background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      onClick={() => setShelfMarkersVisible(true)}
                    >Placera hyllor</button>
                  )}
                </div>
                
                {/* Extra el */}
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                  <input 
                    type="checkbox" 
                    checked={showExtraPower} 
                    onChange={(e) => setShowExtraPower(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  � Extra el-uttag (endast priseffekt)
                </label>
                
                {/* Högtalare på stativ */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔊 Högtalare på stativ
                  </label>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Klicka på montern för att placera högtalare (4 per ruta)
                  </div>
                  {speakers.length > 0 && (
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                      Placerade högtalare: {speakers.length}
                      <button
                        style={{ marginLeft: 12, padding: '2px 8px', fontSize: 11, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                        onClick={() => setSpeakers([])}
                      >Rensa</button>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, marginRight: 8, fontSize: 13 }}>Storlek:</label>
                    <select 
                      value={speakerSize} 
                      onChange={e => setSpeakerSize(e.target.value as 'small' | 'medium' | 'large')}
                      style={{ fontSize: 12, padding: '2px 6px' }}
                    >
                      <option value="small">Liten</option>
                      <option value="medium">Medium</option>
                      <option value="large">Stor</option>
                    </select>
                  </div>
                  {speakerMarkersVisible ? (
                    <button
                      style={{ padding: '4px 12px', fontSize: 12, background: '#1ec94c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      onClick={() => setSpeakerMarkersVisible(false)}
                    >OK</button>
                  ) : (
                    <button
                      style={{ padding: '4px 12px', fontSize: 12, background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      onClick={() => setSpeakerMarkersVisible(true)}
                    >Placera högtalare</button>
                  )}
                </div>
              </div>
            </div>

            {/* Förrådstillbehör */}
            {storages.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 6 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Förrådstillbehör</h3>
                
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                  <input 
                    type="checkbox" 
                    checked={showClothingRacks} 
                    onChange={(e) => setShowClothingRacks(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  👔 Klädhängare i förrå
                </label>
              </div>
            )}
          </>
        )}
  </>}

  {/* Prisberäkning */}
  <div id="price-summary" style={{ 
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#fff',
          borderTop: '2px solid #007acc',
          padding: '16px',
          marginTop: '20px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}>
                <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            margin: '0 0 12px 0' 
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#007acc' 
            }}>
              💰 Totalberäkning
            </h3>
            <button
              onClick={() => setPriceSectionCollapsed(!priceSectionCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#007acc',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              {priceSectionCollapsed ? '⊞' : '⊟'}
            </button>
          </div>
          
                {/* Hidden packlista container for PDF rendering */}
                <div id="packlista-hidden" style={{ position: 'absolute', left: -9999, top: -9999, width: '1024px', padding: 20, background: '#fff', color: '#000' }} />
                
                {/* Hidden price summary container for PDF rendering */}
                <div id="price-summary-hidden" style={{ position: 'absolute', left: -9999, top: -9999, width: '1024px', padding: 20, background: '#fff', color: '#000' }} />
          {floorIndex !== null ? (() => {
            const materialCost = calculatePrice();
            const laborCosts = calculateLaborCosts();
            const subtotal = materialCost + laborCosts.buildCost + laborCosts.demolitionCost + laborCosts.adminFee + laborCosts.consumables;
            const markup = Math.round(subtotal * 0.15); // 15% påslag
            const totalCost = subtotal + markup;
            
            return (
              <div>
                {/* Detailed breakdown - only show when not collapsed */}
                {!priceSectionCollapsed && (
                  <>
                    {/* Materialkostnad */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Material & uthyrning:</span>
                      <span>{materialCost.toLocaleString('sv-SE')} kr</span>
                    </div>
                    
                    {/* Byggkostnad */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Uppsättning ({laborCosts.persons} pers × {laborCosts.buildHours}h):</span>
                      <span>{laborCosts.buildCost.toLocaleString('sv-SE')} kr</span>
                    </div>
                    
                    {/* Rivningskostnad */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Nedmontering ({laborCosts.persons} pers × {laborCosts.demolitionHours}h):</span>
                      <span>{laborCosts.demolitionCost.toLocaleString('sv-SE')} kr</span>
                    </div>
                    
                    {/* Förbrukningsmaterial */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Förbrukningsmaterial:</span>
                      <span>{laborCosts.consumables.toLocaleString('sv-SE')} kr</span>
                    </div>
                    
                    {/* Skissavgift */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Skissavgift:</span>
                      <span>{laborCosts.adminFee.toLocaleString('sv-SE')} kr</span>
                    </div>
                    
                    {/* Subtotal */}
                    <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: 4 }}>
                      <span><strong>Subtotal:</strong></span>
                      <span><strong>{subtotal.toLocaleString('sv-SE')} kr</strong></span>
                    </div>
                    
                    {/* Påslag */}
                    <div style={{ fontSize: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Projektledning:</span>
                      <span>{markup.toLocaleString('sv-SE')} kr</span>
                    </div>
                  </>
                )}
                
                {/* Total - always visible */}
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 700, 
                  color: '#28a745',
                  marginBottom: '8px',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  borderTop: '2px solid #28a745',
                  paddingTop: 8
                }}>
                  <span>TOTALT:</span>
                  <span>{totalCost.toLocaleString('sv-SE')} kr</span>
                </div>
                {/* Beställ-knapp */}
                <div style={{ marginTop: 10, marginBottom: 6 }}>
                  <button
                    onClick={async () => {
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
                      
                      // Funktion för att lägga till vattenstämpel - används på alla sidor
                      const addWatermark = (pdf: any) => {
                        try {
                          // Huvudvattenstämpel
                          pdf.setGState(new pdf.GState({opacity: 0.15}));
                          pdf.addImage('/Loggo/Monterhyra Logotyp.png', 'PNG', 140, 20, 50, 25);
                          
                          // Extra textbaserade vattenstämplar
                          pdf.setGState(new pdf.GState({opacity: 0.08}));
                          pdf.setFontSize(6);
                          pdf.setTextColor(150, 150, 150);
                          pdf.text('FÖRHANDSGRANSKNING - MONTERHYRA.SE', 15, 280);
                          pdf.text('ENDAST FÖR INTERN ANVÄNDNING', 15, 285);
                          
                          // Diagonal vattenstämpel i mitten
                          pdf.setGState(new pdf.GState({opacity: 0.05}));
                          const pageWidth = 210; // A4 width in mm
                          const pageHeight = 297; // A4 height in mm
                          pdf.text('MONTERHYRA DEMO', pageWidth/2 - 20, pageHeight/2, null, 45);
                          
                          pdf.setGState(new pdf.GState({opacity: 1})); // Återställ
                          pdf.setTextColor(0, 0, 0);
                        } catch (e) {
                          // Fallback om vattenstämpel misslyckas
                          pdf.setFontSize(6);
                          pdf.setTextColor(200, 200, 200);
                          pdf.text('© Monterhyra.se - Demo', 170, 30);
                          pdf.text('Licensiering krävs för kommersiell användning', 120, 285);
                          pdf.setTextColor(0, 0, 0);
                        }
                      };
                      
                      try {
                        // Försök att fånga tre olika vyer av montern
                        let views: string[] = [];
                        if (captureRef.current && captureRef.current.captureViews) {
                          try {
                            // Få tre olika kameravyer från CaptureHelper
                            views = captureRef.current.captureViews(1200, 800);
                          } catch (e) {
                            console.warn('Kunde inte fånga olika vyer, använder fallback', e);
                          }
                        }
                        // Om vi inte fick ut tre vyer, använd canvas som fallback
                        if (views.length < 3 && canvasEl) {
                          const imgData = canvasEl.toDataURL('image/jpeg', 0.7);
                          views = [imgData, imgData, imgData];
                        }
                        // Om vi fortfarande inte har tre vyer, använd tomma bilder
                        while (views.length < 3) views.push('');

                        // Sida 1: Ovanifrån-vy med kontaktinfo
                        pdf.setFontSize(16);
                        pdf.setTextColor(40, 62, 80);
                        pdf.text('MONTEROFFERT', 15, 25);
                        pdf.setFontSize(10);
                        pdf.setTextColor(0, 0, 0);
                        let yPos = 35;
                        if (registrationData.name) { pdf.text(`Kontaktperson: ${registrationData.name}`, 15, yPos); yPos += 5; }
                        if (registrationData.company) { pdf.text(`Företag: ${registrationData.company}`, 15, yPos); yPos += 5; }
                        if (registrationData.email) { pdf.text(`E-post: ${registrationData.email}`, 15, yPos); yPos += 5; }
                        if (registrationData.phone) { pdf.text(`Telefon: ${registrationData.phone}`, 15, yPos); yPos += 5; }
                        if (registrationData.orgNumber) { pdf.text(`Organisationsnummer: ${registrationData.orgNumber}`, 15, yPos); yPos += 5; }
                        pdf.setDrawColor(200, 200, 200);
                        pdf.line(15, yPos + 3, 195, yPos + 3);
                        const imageYPos = yPos + 10;
                        const imageHeight = 100;
                        if (views[0]) {
                          pdf.addImage(views[0], 'JPEG', 15, imageYPos, 180, imageHeight);
                        }
                        addWatermark(pdf);
                        pdf.setFontSize(10);
                        pdf.text('Planvy - ovanifrån', 15, imageYPos + imageHeight + 5);

                        // Sida 2: Perspektivvy
                        pdf.addPage();
                        if (views[1]) {
                          pdf.addImage(views[1], 'JPEG', 15, 15, 180, 120);
                        }
                        addWatermark(pdf);
                        pdf.setFontSize(10);
                        pdf.text('Perspektivvy', 15, 140);

                        // Sida 3: Helvy framifrån
                        pdf.addPage();
                        if (views[2]) {
                          pdf.addImage(views[2], 'JPEG', 15, 15, 180, 120);
                        }
                        addWatermark(pdf);
                        pdf.setFontSize(10);
                        pdf.text('Helvy', 15, 140);

                        // Sida 4: Prissammanställning med snygg ruta
                        pdf.addPage();
                        
                        // Skapa och rendera prissammanställning i dolt element
                        const materialCost = calculatePrice();
                        const laborCosts = calculateLaborCosts();
                        const subtotal = materialCost + laborCosts.buildCost + laborCosts.demolitionCost + laborCosts.adminFee + laborCosts.consumables;
                        const markup = Math.round(subtotal * 0.15); // 15% påslag
                        const totalCost = subtotal + markup;
                        
                        const priceEl = document.getElementById('price-summary-hidden');
                        if (priceEl) {
                          priceEl.innerHTML = '';
                          priceEl.style.width = '794px';
                          priceEl.style.padding = '18px';
                          priceEl.style.boxSizing = 'border-box';
                          priceEl.style.fontFamily = 'Optima, Arial, Helvetica, sans-serif';
                          priceEl.style.fontSize = '12pt';
                          priceEl.style.color = '#000';
                          priceEl.style.background = '#fff';

                          const h1 = document.createElement('h2');
                          h1.textContent = 'Prissammanställning';
                          h1.style.margin = '0 0 12px 0';
                          h1.style.fontSize = '1.6em';
                          h1.style.fontWeight = '700';
                          h1.style.fontFamily = 'inherit';
                          priceEl.appendChild(h1);

                          // Prisruta med grön ram (samma som packlista)
                          const box = document.createElement('div');
                          box.style.border = '3px solid #2e8b2e';
                          box.style.padding = '16px';
                          box.style.width = '740px';
                          box.style.margin = '10px auto';
                          box.style.boxShadow = 'none';
                          box.style.boxSizing = 'border-box';
                          box.style.background = '#fff';

                          const priceContainer = document.createElement('div');
                          priceContainer.style.fontFamily = 'Optima, Arial, Helvetica, sans-serif';
                          priceContainer.style.fontSize = '11pt';

                          // Grundspecifikation först
                          const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
                          const floorW = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
                          const floorD = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
                          
                          const specDiv = document.createElement('div');
                          specDiv.style.marginBottom = '16px';
                          specDiv.style.padding = '8px';
                          specDiv.style.backgroundColor = '#f8f9fa';
                          specDiv.style.borderRadius = '4px';
                          specDiv.innerHTML = `
                            <div style="font-weight: 600; margin-bottom: 4px;">Monterspecifikation:</div>
                            <div>Monterstorlek: ${floorW} × ${floorD} meter (${floorW * floorD} kvm)</div>
                            <div>Väggform: ${WALL_SHAPES.find(w => w.value === wallShape)?.label || 'Okänd'}</div>
                            <div>Vägghöjd: ${wallHeight} meter</div>
                          `;
                          priceContainer.appendChild(specDiv);

                          // Prisuppdelning utan checkboxar (bara label och pris)
                          const makeRowElement = (labelText: string, priceText: string) => {
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.justifyContent = 'space-between';
                            item.style.alignItems = 'center';
                            item.style.padding = '6px 2px';
                            item.style.breakInside = 'avoid';

                            const left = document.createElement('div');
                            left.textContent = labelText;
                            left.style.color = '#222';
                            left.style.fontSize = '11pt';

                            const price = document.createElement('div');
                            price.textContent = priceText;
                            price.style.fontWeight = '700';
                            price.style.color = '#007acc';
                            price.style.fontSize = '11pt';

                            item.appendChild(left);
                            item.appendChild(price);
                            return item;
                          };

                          // Lägg till prisrader
                          priceContainer.appendChild(makeRowElement('Material & uthyrning', `${materialCost.toLocaleString('sv-SE')} kr`));
                          priceContainer.appendChild(makeRowElement(`Uppsättning (${laborCosts.persons} pers × ${laborCosts.buildHours}h)`, `${laborCosts.buildCost.toLocaleString('sv-SE')} kr`));
                          priceContainer.appendChild(makeRowElement(`Nedmontering (${laborCosts.persons} pers × ${laborCosts.demolitionHours}h)`, `${laborCosts.demolitionCost.toLocaleString('sv-SE')} kr`));
                          priceContainer.appendChild(makeRowElement('Förbrukningsmaterial', `${laborCosts.consumables.toLocaleString('sv-SE')} kr`));
                          priceContainer.appendChild(makeRowElement('Skissavgift', `${laborCosts.adminFee.toLocaleString('sv-SE')} kr`));

                          // Subtotal linje
                          const subtotalDiv = document.createElement('div');
                          subtotalDiv.style.borderTop = '2px solid #ddd';
                          subtotalDiv.style.marginTop = '8px';
                          subtotalDiv.style.paddingTop = '8px';
                          priceContainer.appendChild(subtotalDiv);
                          
                          subtotalDiv.appendChild(makeRowElement('Subtotal', `${subtotal.toLocaleString('sv-SE')} kr`));
                          subtotalDiv.appendChild(makeRowElement('Projektledning (15%)', `${markup.toLocaleString('sv-SE')} kr`));

                          // Total linje
                          const totalDiv = document.createElement('div');
                          totalDiv.style.borderTop = '3px solid #28a745';
                          totalDiv.style.marginTop = '8px';
                          totalDiv.style.paddingTop = '8px';
                          totalDiv.style.backgroundColor = '#f8fff8';
                          totalDiv.style.borderRadius = '4px';
                          totalDiv.style.padding = '12px 8px';
                          
                          const totalRow = document.createElement('div');
                          totalRow.style.display = 'flex';
                          totalRow.style.justifyContent = 'space-between';
                          totalRow.style.alignItems = 'center';
                          totalRow.style.fontSize = '14pt';
                          totalRow.style.fontWeight = '700';
                          totalRow.style.color = '#28a745';
                          
                          const totalLabel = document.createElement('div');
                          totalLabel.textContent = 'TOTALT:';
                          const totalPrice = document.createElement('div');
                          totalPrice.textContent = `${totalCost.toLocaleString('sv-SE')} kr`;
                          
                          totalRow.appendChild(totalLabel);
                          totalRow.appendChild(totalPrice);
                          totalDiv.appendChild(totalRow);
                          priceContainer.appendChild(totalDiv);

                          box.appendChild(priceContainer);
                          priceEl.appendChild(box);

                          // Rendera till PDF med html2canvas
                          const cPrice = await html2canvas(priceEl as HTMLElement, { backgroundColor: '#ffffff', scale: 2 });
                          const imgData = cPrice.toDataURL('image/png');
                          const imgW = cPrice.width;
                          const imgH = cPrice.height;
                          const pdfUsableW = 180; // mm
                          const imgHeightMm = (imgH / imgW) * pdfUsableW;
                          pdf.addImage(imgData, 'PNG', 15, 15, pdfUsableW, imgHeightMm);
                        }

                        // Sida 5: Packlista - tas bort för kundens PDF (finns i admin-portalen istället)
                        // (Ingen kod här, packlistan genereras ej)

                        // Lägg till juridisk sida med villkor

                        pdf.addPage();
                        addWatermark(pdf);
                        // Rubrik
                        pdf.setFontSize(18);
                        pdf.setTextColor(40, 62, 80);
                        pdf.text('VILLKOR & ANSVARSFRISKRIVNING', 15, 25);
                        // Innehåll
                        pdf.setFontSize(10);
                        pdf.setTextColor(0, 0, 0);
                        let yPosVillkor = 35;
                        const addSection = (title: string, content: string[]) => {
                          pdf.setFontSize(12);
                          pdf.setTextColor(40, 62, 80);
                          pdf.text(title, 15, yPosVillkor);
                          yPosVillkor += 8;
                          pdf.setFontSize(9);
                          pdf.setTextColor(0, 0, 0);
                          content.forEach(line => {
                            const splitText = pdf.splitTextToSize(line, 180);
                            pdf.text(splitText, 15, yPosVillkor);
                            yPosVillkor += splitText.length * 4;
                          });
                          yPosVillkor += 3;
                        };
                        addSection('1. Ansvarsfriskrivning', [
                          'Denna PDF är endast en offert och inte ett bindande avtal.',
                          'Priser, produkter och innehåll kan komma att ändras. Slutgiltig orderbekräftelse sker först efter skriftligt godkännande från Monterhyra. Vi reserverar oss för tryckfel, prisändringar och eventuella tekniska avvikelser i produkter och material.'
                        ]);
                        addSection('2. Äganderätt / Upphovsrätt', [
                          'Alla ritningar, 3D-visualiseringar, bilder och dokument i denna PDF tillhör Monterhyra och får inte kopieras, spridas eller användas av tredje part utan skriftligt tillstånd.'
                        ]);
                        addSection('3. Beställningsvillkor', [
                          'En beställning blir giltig först när den har mottagits och bekräftats skriftligt av Monterhyra.',
                          'Leveranstider och priser är preliminära fram till orderbekräftelse.'
                        ]);
                        addSection('4. Ansvar för leverans & montering', [
                          'Monterhyra ansvarar inte för förseningar eller skador orsakade av:',
                          '• Tredje part (t.ex. transportföretag)',
                          '• Tekniska problem eller fel i material',
                          '• Förändringar i kundens monteryta eller miljö som påverkar montering',
                          '• Övriga omständigheter utanför Monterhyras kontroll'
                        ]);
                        addSection('5. Integritet / GDPR', [
                          'Personuppgifter som samlas in i samband med beställning hanteras enligt gällande dataskyddslagstiftning (GDPR) och används endast för att fullfölja beställningen.'
                        ]);
                        addSection('ALLMÄNNA VILLKOR', [
                          'Offert och accept – Denna PDF utgör endast en offert. Beställning blir giltig först efter skriftlig bekräftelse från Monterhyra.',
                          '',
                          'Betalning – Faktura skickas i samband med orderbekräftelse. Betalning ska ske enligt fakturans villkor.',
                          '',
                          'Ändringar och avbokning – Vid avbokning:',
                          '• Mindre än 2 veckor före mässa debiteras 50% av ordervärdet.',
                          '• Mer än 2 veckor före mässa debiteras 25% av ordervärdet.',
                          '',
                          'Ansvar – Monterhyra ansvarar inte för skador, förseningar eller förluster utanför vår direkta kontroll.',
                          '',
                          'Force Majeure – Monterhyra ansvarar inte för förseningar eller utebliven leverans på grund av händelser utanför vår kontroll, t.ex. naturkatastrofer, strejk eller tekniska fel.',
                          '',
                          'Tillämplig lag och tvist – Svensk lag gäller. Eventuella tvister ska i första hand lösas genom förhandlingar.'
                        ]);

                        pdf.save('monter-bestallning.pdf');
                      } catch (err) {
                        console.error('Fel vid skapande av PDF', err);
                        alert('Kunde inte skapa PDF. Försök öppna appen i ett nytt fönster eller kontrollera att inga cross-origin-bilder används.');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#666666',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: '8px'
                    }}
                  >
                    📄 PDF
                  </button>
                  
                  {/* Ny Beställ-knapp som skickar e-post med EmailJS */}
                  <button
                    onClick={async () => {
                      try {
                        console.log('Beställ-knapp klickad');
                        console.log('Registration data:', registrationData);
                        
                        // Kolla om EmailJS är tillgängligt
                        if (!emailjs) {
                          throw new Error('EmailJS är inte laddat');
                        }
                        
                        // Använd samma avancerade PDF-kod som PDF-knappen
                        console.log('Skapar avancerad PDF med alla detaljer...');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
                        
                        // Watermark-funktion
                        const addWatermark = (pdf: any) => {
                          pdf.setFontSize(12);
                          pdf.setTextColor(180, 180, 180);
                          pdf.text('MONTERHYRA - www.monterhyra.se', 15, 285);
                          pdf.setTextColor(0, 0, 0);
                        };
                        
                        try {
                          // Försök att fånga tre olika vyer av montern (samma som PDF-knappen)
                          if (captureRef.current && captureRef.current.captureViews) {
                            try {
                              // Få tre olika kameravyer från CaptureHelper
                              const views = captureRef.current.captureViews(1200, 800);
                              
                              // Sida 1: Ovanifrån-vy med kontaktinfo
                              if (views[0]) {
                                pdf.setFontSize(16);
                                pdf.setTextColor(40, 62, 80);
                                pdf.text('MONTEROFFERT', 15, 25);
                                
                                // Kontaktinformation
                                pdf.setFontSize(10);
                                pdf.setTextColor(0, 0, 0);
                                let yPos = 35;
                                
                                if (registrationData.name) {
                                  pdf.text(`Kontaktperson: ${registrationData.name}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.company) {
                                  pdf.text(`Företag: ${registrationData.company}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.email) {
                                  pdf.text(`E-post: ${registrationData.email}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.phone) {
                                  pdf.text(`Telefon: ${registrationData.phone}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.orgNumber) {
                                  pdf.text(`Organisationsnummer: ${registrationData.orgNumber}`, 15, yPos);
                                  yPos += 5;
                                }
                                
                                // Linje under kontaktinfo
                                pdf.setDrawColor(200, 200, 200);
                                pdf.line(15, yPos + 3, 195, yPos + 3);
                                
                                // Montervy
                                const imageYPos = yPos + 10;
                                const imageHeight = 100;
                                pdf.addImage(views[0], 'JPEG', 15, imageYPos, 180, imageHeight);
                                addWatermark(pdf);
                                pdf.setFontSize(10);
                                pdf.text('Planvy - ovanifrån', 15, imageYPos + imageHeight + 5);
                              }
                              
                              // Sida 2: Perspektivvy 
                              if (views[1]) {
                                pdf.addPage();
                                pdf.addImage(views[1], 'JPEG', 15, 15, 180, 120);
                                addWatermark(pdf);
                                pdf.setFontSize(10);
                                pdf.text('Perspektivvy', 15, 140);
                              }
                              
                              // Sida 3: Helvy från andra sidan
                              if (views[2]) {
                                pdf.addPage();
                                pdf.addImage(views[2], 'JPEG', 15, 15, 180, 120);
                                addWatermark(pdf);
                                pdf.setFontSize(10);
                                pdf.text('Helvy', 15, 140);
                              }
                              
                            } catch (e) {
                              console.warn('Kunde inte fånga olika vyer, använder fallback', e);
                              // Fallback: använd canvas direkt
                              if (canvasEl) {
                                const imgData = canvasEl.toDataURL('image/jpeg', 0.7); // JPEG med 70% kvalitet
                                
                                pdf.setFontSize(16);
                                pdf.setTextColor(40, 62, 80);
                                pdf.text('MONTEROFFERT', 15, 25);
                                
                                // Kontaktinformation
                                pdf.setFontSize(10);
                                pdf.setTextColor(0, 0, 0);
                                let yPos = 35;
                                
                                if (registrationData.name) {
                                  pdf.text(`Kontaktperson: ${registrationData.name}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.company) {
                                  pdf.text(`Företag: ${registrationData.company}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.email) {
                                  pdf.text(`E-post: ${registrationData.email}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.phone) {
                                  pdf.text(`Telefon: ${registrationData.phone}`, 15, yPos);
                                  yPos += 5;
                                }
                                if (registrationData.orgNumber) {
                                  pdf.text(`Organisationsnummer: ${registrationData.orgNumber}`, 15, yPos);
                                  yPos += 5;
                                }
                                
                                pdf.setDrawColor(200, 200, 200);
                                pdf.line(15, yPos + 3, 195, yPos + 3);
                                
                                const imageYPos = yPos + 10;
                                const imageHeight = 100;
                                pdf.addImage(imgData, 'JPEG', 15, imageYPos, 180, imageHeight);
                                pdf.setFontSize(10);
                                pdf.text('3D-vy av montern', 15, imageYPos + imageHeight + 5);
                              }
                            }
                          }
                          
                          // Sida 4: Prissammanställning (samma som PDF-knappen)
                          pdf.addPage();
                          
                          const materialCost = calculatePrice();
                          const laborCosts = calculateLaborCosts();
                          const subtotal = materialCost + laborCosts.buildCost + laborCosts.demolitionCost + laborCosts.adminFee + laborCosts.consumables;
                          const markup = Math.round(subtotal * 0.15);
                          const totalCost = subtotal + markup;
                          
                          const priceEl = document.getElementById('price-summary-hidden');
                          if (priceEl) {
                            // Samma prissammanställningslogik som PDF-knappen...
                            priceEl.innerHTML = '';
                            priceEl.style.width = '794px';
                            priceEl.style.padding = '18px';
                            priceEl.style.boxSizing = 'border-box';
                            priceEl.style.fontFamily = 'Optima, Arial, Helvetica, sans-serif';
                            priceEl.style.fontSize = '12pt';
                            priceEl.style.color = '#000';
                            priceEl.style.background = '#fff';

                            const h1 = document.createElement('h2');
                            h1.textContent = 'Prissammanställning';
                            h1.style.margin = '0 0 12px 0';
                            h1.style.fontSize = '1.6em';
                            h1.style.fontWeight = '700';
                            h1.style.fontFamily = 'inherit';
                            priceEl.appendChild(h1);

                            const box = document.createElement('div');
                            box.style.border = '3px solid #2e8b2e';
                            box.style.padding = '16px';
                            box.style.width = '740px';
                            box.style.margin = '10px auto';
                            box.style.boxShadow = 'none';
                            box.style.boxSizing = 'border-box';
                            box.style.background = '#fff';

                            const priceContainer = document.createElement('div');
                            priceContainer.style.fontFamily = 'Optima, Arial, Helvetica, sans-serif';
                            priceContainer.style.fontSize = '11pt';

                            // Grundspecifikation först
                            const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
                            const floorW = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
                            const floorD = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
                            
                            const specDiv = document.createElement('div');
                            specDiv.style.marginBottom = '16px';
                            specDiv.style.padding = '8px';
                            specDiv.style.backgroundColor = '#f8f9fa';
                            specDiv.style.borderRadius = '4px';
                            specDiv.innerHTML = `
                              <div style="font-weight: 600; margin-bottom: 4px;">Monterspecifikation:</div>
                              <div>Monterstorlek: ${floorW} × ${floorD} meter (${floorW * floorD} kvm)</div>
                              <div>Väggform: ${WALL_SHAPES.find(w => w.value === wallShape)?.label || 'Okänd'}</div>
                              <div>Vägghöjd: ${wallHeight} meter</div>
                            `;
                            priceContainer.appendChild(specDiv);

                            // Prisrader
                            const makeRowElement = (labelText: string, priceText: string) => {
                              const item = document.createElement('div');
                              item.style.display = 'flex';
                              item.style.justifyContent = 'space-between';
                              item.style.alignItems = 'center';
                              item.style.padding = '6px 2px';
                              item.style.breakInside = 'avoid';

                              const left = document.createElement('div');
                              left.textContent = labelText;
                              left.style.color = '#222';
                              left.style.fontSize = '11pt';

                              const price = document.createElement('div');
                              price.textContent = priceText;
                              price.style.fontWeight = '700';
                              price.style.color = '#007acc';
                              price.style.fontSize = '11pt';

                              item.appendChild(left);
                              item.appendChild(price);
                              return item;
                            };

                            priceContainer.appendChild(makeRowElement('Material & uthyrning', `${materialCost.toLocaleString('sv-SE')} kr`));
                            priceContainer.appendChild(makeRowElement(`Uppsättning (${laborCosts.persons} pers × ${laborCosts.buildHours}h)`, `${laborCosts.buildCost.toLocaleString('sv-SE')} kr`));
                            priceContainer.appendChild(makeRowElement(`Nedmontering (${laborCosts.persons} pers × ${laborCosts.demolitionHours}h)`, `${laborCosts.demolitionCost.toLocaleString('sv-SE')} kr`));
                            priceContainer.appendChild(makeRowElement('Förbrukningsmaterial', `${laborCosts.consumables.toLocaleString('sv-SE')} kr`));
                            priceContainer.appendChild(makeRowElement('Skissavgift', `${laborCosts.adminFee.toLocaleString('sv-SE')} kr`));

                            // Subtotal
                            const subtotalDiv = document.createElement('div');
                            subtotalDiv.style.borderTop = '2px solid #ddd';
                            subtotalDiv.style.marginTop = '8px';
                            subtotalDiv.style.paddingTop = '8px';
                            priceContainer.appendChild(subtotalDiv);
                            
                            subtotalDiv.appendChild(makeRowElement('Subtotal', `${subtotal.toLocaleString('sv-SE')} kr`));
                            subtotalDiv.appendChild(makeRowElement('Projektledning (15%)', `${markup.toLocaleString('sv-SE')} kr`));

                            // Total
                            const totalDiv = document.createElement('div');
                            totalDiv.style.borderTop = '3px solid #28a745';
                            totalDiv.style.marginTop = '8px';
                            totalDiv.style.paddingTop = '8px';
                            totalDiv.style.backgroundColor = '#f8fff8';
                            totalDiv.style.borderRadius = '4px';
                            totalDiv.style.padding = '12px 8px';
                            
                            const totalRow = document.createElement('div');
                            totalRow.style.display = 'flex';
                            totalRow.style.justifyContent = 'space-between';
                            totalRow.style.alignItems = 'center';
                            totalRow.style.fontSize = '14pt';
                            totalRow.style.fontWeight = '700';
                            totalRow.style.color = '#28a745';
                            
                            const totalLabel = document.createElement('div');
                            totalLabel.textContent = 'TOTALT:';
                            const totalPrice = document.createElement('div');
                            totalPrice.textContent = `${totalCost.toLocaleString('sv-SE')} kr`;
                            
                            totalRow.appendChild(totalLabel);
                            totalRow.appendChild(totalPrice);
                            totalDiv.appendChild(totalRow);
                            priceContainer.appendChild(totalDiv);

                            box.appendChild(priceContainer);
                            priceEl.appendChild(box);

                            // Rendera till PDF
                            const cPrice = await html2canvas(priceEl as HTMLElement, { backgroundColor: '#ffffff', scale: 2 });
                            const imgData = cPrice.toDataURL('image/png');
                            const imgW = cPrice.width;
                            const imgH = cPrice.height;
                            const pdfUsableW = 180;
                            const imgHeightMm = (imgH / imgW) * pdfUsableW;
                            pdf.addImage(imgData, 'PNG', 15, 15, pdfUsableW, imgHeightMm);
                          }
                          
                            // Sida 5: Packlista - tas bort för kundens PDF (finns i admin-portalen istället)
                            // (Kod för att rendera packlista är helt borttagen här)
                          
                          // Sida 6: Villkor
                          pdf.addPage();
                          pdf.setFontSize(16);
                          pdf.text('ALLMÄNNA VILLKOR', 15, 25);
                          pdf.setFontSize(10);
                          const villkor = [
                            'Priser gäller i 30 dagar från offertdatum.',
                            'Alla priser är exklusive moms.',
                            'Betalning sker enligt överenskommen betalningsplan.',
                            'Uppsättning och nedmontering ingår i priset.',
                            'Transport debiteras enligt gällande prislista.',
                            'Ändringar efter bekräftad beställning kan medföra extra kostnader.',
                            'Kunden ansvarar för att monterområdet är förberet vid leverans.',
                            'Skador som uppstår under uthyrningsperioden debiteras enligt prislista.',
                            'Avbokning senare än 7 dagar före uppsättning medför avgift.',
                            'Monterhyra förbehåller sig rätten till ändringar.'
                          ];
                          
                          let yPos = 40;
                          villkor.forEach((villkor, index) => {
                            pdf.text(`${index + 1}. ${villkor}`, 15, yPos);
                            yPos += 8;
                          });
                          
                          addWatermark(pdf);
                          
                          // Konvertera till base64 för e-post
                          const pdfBase64 = pdf.output('datauristring');
                          const pdfBase64Only = pdfBase64.split(',')[1];
                          console.log('Avancerad PDF skapad, storlek:', pdfBase64Only.length);
                          
                          // Ladda ner lokalt för kunden
                          const timestamp = Date.now();
                          const filename = `monteroffert-${timestamp}.pdf`;
                          pdf.save(filename);
                          
                          // EmailJS konfiguration
                          const serviceId = 'service_rd6m6ys';
                          const templateId = 'template_70rgvmm'; 
                          const publicKey = 'dovkvDHK77DZp1OUz';
                          
                          // Skapa textmeddelande UTAN PDF (för stor för mail)
                          const orderDetails = `
MONTERBESTÄLLNING - ${new Date().toLocaleDateString('sv-SE')}

KONTAKTUPPGIFTER:
• Namn: ${registrationData.name || 'Ej angivet'}
• Företag: ${registrationData.company || 'Ej angivet'}
• E-post: ${registrationData.email || 'Ej angivet'}
• Telefon: ${registrationData.phone || 'Ej angivet'}
• Org.nummer: ${registrationData.orgNumber || 'Ej angivet'}

EVENTDETALJER:
• Eventnamn: ${registrationData.eventName || 'Ej angivet'}
• Eventstad: ${registrationData.eventCity || 'Ej angivet'}
• Eventdatum: ${registrationData.eventDate || 'Ej angivet'}
• Byggdatum: ${registrationData.buildDate || 'Ej angivet'}
• Nedmonteringsdatum: ${registrationData.teardownDate || 'Ej angivet'}

MONTERDETALJER:
• Beställning gjord: ${new Date().toLocaleString('sv-SE')}
• Totalpris: ${totalCost.toLocaleString('sv-SE')} kr

📁 FILER OCH TRYCKUNDERLAG:
Alla PDF-filer, tryckfiler och komplett offert finns tillgängliga i admin-portalen.
Logga in på admin-portalen för att ladda ner ZIP-fil med alla filer.

NÄSTA STEG:
1. Logga in på admin-portalen och ladda ner filer
2. Kontakta kunden på ${registrationData.phone || registrationData.email}
3. Bekräfta beställning och planera leverans/montering

Med vänliga hälsningar,
Monterhyra Beställningssystem
                          `;
                          
                          // Skicka e-post med EmailJS
                          const templateParams = {
                            to_name: 'Monterhyra',
                            to_email: 'monterhyra@gmail.com',
                            from_name: registrationData.name || 'Kund',
                            reply_to: registrationData.email || 'ej-angivet@email.com',
                            company: registrationData.company || 'Ej angivet',
                            phone: registrationData.phone || 'Ej angivet',
                            message: orderDetails
                          };
                          
                          // Initiera EmailJS och skicka e-post
                          emailjs.init(publicKey);
                          console.log('EmailJS initierat, skickar avancerad PDF...');
                          const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
                          console.log('EmailJS framgångsrikt:', result);
                          
                          // Spara beställning till admin-portal med alla PDFer
                          try {
                            console.log('💾 Sparar beställning till admin-portal...');
                            
                            // Förbered kundinfo
                            const customerInfo: CustomerInfo = {
                              name: registrationData.name || '',
                              email: registrationData.email || '',
                              phone: registrationData.phone || '',
                              company: registrationData.company || '',
                              deliveryAddress: registrationData.eventCity || '',
                              eventDate: registrationData.eventDate || '',
                              eventTime: '', 
                              setupTime: registrationData.buildDate || '',
                              pickupTime: registrationData.teardownDate || '',
                              message: registrationData.eventName || ''
                            };
                            
                            // Förbered beställningsdata
                            // Beräkna detaljerad packlista
                            const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
                            const floorW = floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 0);
                            const floorD = floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 0);
                            const packlistaData = computePacklista(wallShape, floorW, floorD, wallHeight, storages);
                            
                            // FÖRBÄTTRA packlistaData med alla saknade artiklar (samma som email PDF)
                            try {
                              // SAM-led
                              const computeSamLed = () => {
                                let sum = 0;
                                if (wallShape === 'straight') sum = floorW;
                                else if (wallShape === 'l') sum = floorW + floorD;
                                else if (wallShape === 'u') sum = floorW + (floorD * 2);
                                return Math.round(sum);
                              };
                              const samLedCount = computeSamLed();
                              if (samLedCount > 0) {
                                packlistaData.totals = packlistaData.totals || {};
                                (packlistaData.totals as any)['SAM-led'] = samLedCount;
                              }
                              
                              // Vepa väggområden (main walls)
                              if (graphic === 'vepa') {
                                packlistaData.totals = packlistaData.totals || {};
                                if (uploadedImage && floorW > 0) (packlistaData.totals as any)['Vepa bakvägg'] = `${Math.round((floorW * wallHeight) * 10)/10} kvm (${floorW}m × ${wallHeight}m)`;
                                if ((wallShape === 'l' || wallShape === 'u') && uploadedImageLeft && floorD > 0) (packlistaData.totals as any)['Vepa vänster vägg'] = `${Math.round((floorD * wallHeight) * 10)/10} kvm (${floorD}m × ${wallHeight}m)`;
                                if (wallShape === 'u' && uploadedImageRight && floorD > 0) (packlistaData.totals as any)['Vepa höger vägg'] = `${Math.round((floorD * wallHeight) * 10)/10} kvm (${floorD}m × ${wallHeight}m)`;
                              }
                              
                              // Forex väggområden (main walls)
                              if (graphic === 'forex') {
                                packlistaData.totals = packlistaData.totals || {};
                                if (vepaWallDesigns.length > 0) {
                                  vepaWallDesigns.forEach((design) => {
                                    const area = Math.round((design.widthMM / 1000) * (design.heightMM / 1000) * 10) / 10;
                                    (packlistaData.totals as any)[`Forex ${design.wallLabel}`] = `${area} kvm (${Math.round(design.widthMM/100)/10}m × ${Math.round(design.heightMM/100)/10}m)`;
                                  });
                                }
                              }
                              
                              // Förråd med Vepa/Forex tryck
                              storageDesigns.forEach((storageData, storageId) => {
                                const printType = storageData.printType;
                                const printLabel = printType === 'vepa' ? 'Vepa' : 'Forex';
                                storageData.designs.forEach((design) => {
                                  const area = Math.round((design.widthMM / 1000) * (design.heightMM / 1000) * 10) / 10;
                                  const label = `${printLabel} Förråd${storageId} ${design.wallLabel}`;
                                  (packlistaData.totals as any)[label] = `${area} kvm (${Math.round(design.widthMM/100)/10}m × ${Math.round(design.heightMM/100)/10}m)`;
                                });
                              });
                              
                              // Småsaker
                              if (showEspressoMachine) (packlistaData.totals as any)['Espressomaskin'] = ((packlistaData.totals as any)['Espressomaskin'] || 0) + 1;
                              if (showFlowerVase) (packlistaData.totals as any)['Blomma'] = ((packlistaData.totals as any)['Blomma'] || 0) + 1;
                              if (showCandyBowl) (packlistaData.totals as any)['Godiskål'] = ((packlistaData.totals as any)['Godiskål'] || 0) + 1;
                              
                              // TV-räkningar
                              if ((tvs || []).length > 0) {
                                const tvCounts: Record<string, number> = {};
                                (tvs || []).forEach(tv => {
                                  const label = TV_SIZES[tv.size]?.label || 'Okänd';
                                  tvCounts[label] = (tvCounts[label] || 0) + 1;
                                });
                                Object.keys(tvCounts).forEach(lbl => {
                                  packlistaData.totals = packlistaData.totals || {};
                                  (packlistaData.totals as any)[`TV ${lbl}`] = ((packlistaData.totals as any)[`TV ${lbl}`] || 0) + tvCounts[lbl];
                                });
                              }
                              
                              // Matta
                              if (carpetIndex !== 0) {
                                const selectedCarpet = CARPET_COLORS[carpetIndex];
                                (packlistaData.totals as any)['Matta'] = `${floorW}×${floorD} ${selectedCarpet.name}`;
                              }
                              
                              // Väggyhyllor och högtalare
                              if ((wallShelves || []).length > 0) {
                                const shelfCount = (wallShelves || []).length;
                                packlistaData.totals = packlistaData.totals || {};
                                (packlistaData.totals as any)['Hyllplan'] = ((packlistaData.totals as any)['Hyllplan'] || 0) + shelfCount;
                                (packlistaData.totals as any)['Hyllbracket'] = ((packlistaData.totals as any)['Hyllbracket'] || 0) + (shelfCount * 2);
                              }
                              if ((speakers || []).length > 0) {
                                const sCount = (speakers || []).length;
                                packlistaData.totals = packlistaData.totals || {};
                                (packlistaData.totals as any)['Högtalare'] = ((packlistaData.totals as any)['Högtalare'] || 0) + sCount;
                                (packlistaData.totals as any)['Högtalarstativ'] = ((packlistaData.totals as any)['Högtalarstativ'] || 0) + sCount;
                              }
                              if (showClothingRacks) {
                                packlistaData.totals = packlistaData.totals || {};
                                (packlistaData.totals as any)['Klädhängare'] = ((packlistaData.totals as any)['Klädhängare'] || 0) + 1;
                              }
                              
                              // Disk-delar (lägg till alla delar från placerade diskar)
                              if ((counters || []).length > 0) {
                                packlistaData.totals = packlistaData.totals || {};
                                // Lägg till grundläggande disk-enheter
                                (packlistaData.totals as any)['disk innehylla'] = ((packlistaData.totals as any)['disk innehylla'] || 0) + (counters || []).length * 2;
                                
                                // Lägg till alla delar från varje disk
                                (counters || []).forEach((counter) => {
                                  const cfg = COUNTER_TYPES.find(ct => ct.label === counter.type);
                                  if (!cfg) return;
                                  
                                  const add = (key: string, n = 1) => { 
                                    (packlistaData.totals as any)[key] = ((packlistaData.totals as any)[key] || 0) + n; 
                                  };

                                  // Helper: increment matching grafik entries for a frame size
                                  const addGrafik = (frameKey: string, n = 1) => {
                                    // frameKey expected like 'Bematrix ram 1x1' -> Grafik 1x1
                                    const m = frameKey.match(/(\d+,?\d*)x(\d+,?\d*)/);
                                    if (m) {
                                      const gx = `${m[1].replace('.', ',')}x${m[2].replace('.', ',')}`;
                                      add(`Grafik ${gx}`, n);
                                    }
                                  };

                                  if (cfg.type === 'L' || cfg.type === 'L-mirrored') {
                                    add('Bematrix ram 0,5x2', 4);
                                    add('Bematrix ram 1,5x1', 1);
                                    add('Bematrix ram 1x1', 1);
                                    add('Barskiva 1,5x0,5', 1);
                                    add('Barskiva 1x0,5', 1);
                                    add('Lister forex', 4);
                                    add('Corners', 3);
                                    add('M8pin', 10);
                                    add('Special connector', 4);
                                    addGrafik('Bematrix ram 0,5x2', 4);
                                    addGrafik('Bematrix ram 1,5x1', 1);
                                    addGrafik('Bematrix ram 1x1', 1);
                                  } else {
                                    switch (cfg.width) {
                                      case 1:
                                        add('Bematrix ram 0,5x2', 2);
                                        add('Bematrix ram 1x1', 1);
                                        add('Barskiva 1x0,5', 1);
                                        add('Lister forex', 4);
                                        addGrafik('Bematrix ram 0,5x2', 2);
                                        addGrafik('Bematrix ram 1x1', 1);
                                        break;
                                      case 1.5:
                                        add('Bematrix ram 0,5x2', 2);
                                        add('Bematrix ram 1,5x1', 1);
                                        add('Barskiva 1,5x0,5', 1);
                                        add('Lister forex', 4);
                                        add('Corners', 2);
                                        add('M8pin', 6);
                                        add('Special connector', 2);
                                        addGrafik('Bematrix ram 0,5x2', 2);
                                        addGrafik('Bematrix ram 1,5x1', 1);
                                        break;
                                      case 2:
                                        add('Bematrix ram 0,5x2', 2);
                                        add('Bematrix ram 2x1', 1);
                                        add('Barskiva 2x0,5', 1);
                                        add('Lister forex', 4);
                                        add('Corners', 2);
                                        add('M8pin', 6);
                                        add('Special connector', 2);
                                        addGrafik('Bematrix ram 0,5x2', 2);
                                        addGrafik('Bematrix ram 2x1', 1);
                                        break;
                                      case 2.5:
                                        add('Bematrix ram 0,5x2', 2);
                                        add('Bematrix ram 2,5x1', 1);
                                        add('Barskiva 2,5x0,5', 1);
                                        add('Lister forex', 4);
                                        add('Corners', 2);
                                        add('M8pin', 6);
                                        add('Special connector', 2);
                                        addGrafik('Bematrix ram 0,5x2', 2);
                                        addGrafik('Bematrix ram 2,5x1', 1);
                                        break;
                                      case 3:
                                        add('Bematrix ram 0,5x2', 2);
                                        add('Bematrix ram 3x1', 1);
                                        add('Barskiva 3x0,5', 1);
                                        add('Lister forex', 4);
                                        add('Corners', 2);
                                        add('M8pin', 6);
                                        add('Special connector', 2);
                                        addGrafik('Bematrix ram 0,5x2', 2);
                                        addGrafik('Bematrix ram 3x1', 1);
                                        break;
                                    }
                                  }
                                });
                              }
                              if (graphic && graphic !== 'none') {
                                const g = GRAPHICS.find(gr => gr.value === graphic);
                                if (g) (packlistaData.totals as any)['Grafik'] = g.label;
                              }
                              
                              // Växter
                              if ((plants || []).length > 0) {
                                const plantCounts: Record<string, number> = {};
                                (plants || []).forEach(p => {
                                  const label = PLANT_TYPES[p.type]?.label || 'Okänd';
                                  plantCounts[label] = (plantCounts[label] || 0) + 1;
                                });
                                Object.keys(plantCounts).forEach(lbl => {
                                  (packlistaData.totals as any)[lbl] = ((packlistaData.totals as any)[lbl] || 0) + plantCounts[lbl];
                                });
                              }
                              
                              // Möbler
                              if ((furniture || []).length > 0) {
                                const furnCounts: Record<string, number> = {};
                                (furniture || []).forEach(f => {
                                  const label = FURNITURE_TYPES[f.type]?.label || 'Okänd';
                                  furnCounts[label] = (furnCounts[label] || 0) + 1;
                                });
                                Object.keys(furnCounts).forEach(lbl => {
                                  (packlistaData.totals as any)[lbl] = ((packlistaData.totals as any)[lbl] || 0) + furnCounts[lbl];
                                });
                              }
                              
                              // Truss-delar
                              if (selectedTrussType > 0) {
                                const sel = TRUSS_TYPES[selectedTrussType];
                                if (sel.type === 'hanging-square') {
                                  (packlistaData.totals as any)['Truss 2m'] = ((packlistaData.totals as any)['Truss 2m'] || 0) + 4;
                                  (packlistaData.totals as any)['Vajer upphängning'] = ((packlistaData.totals as any)['Vajer upphängning'] || 0) + 4;
                                  (packlistaData.totals as any)['Trusslampa'] = ((packlistaData.totals as any)['Trusslampa'] || 0) + 4;
                                } else if (sel.type === 'hanging-round') {
                                  (packlistaData.totals as any)['Truss rund 90grader'] = ((packlistaData.totals as any)['Truss rund 90grader'] || 0) + 4;
                                  (packlistaData.totals as any)['Vajer upphängning'] = ((packlistaData.totals as any)['Vajer upphängning'] || 0) + 4;
                                  (packlistaData.totals as any)['Trusslampa'] = ((packlistaData.totals as any)['Trusslampa'] || 0) + 6;
                                } else if (sel.type === 'front-straight') {
                                  const frontWidth = floorIndex !== null ? (FLOOR_SIZES[floorIndex].custom ? customFloorWidth : FLOOR_SIZES[floorIndex].width) : 0;
                                  const twoMeterCount = Math.floor(frontWidth / 2);
                                  const remainder = frontWidth - (twoMeterCount * 2);
                                  const oneMeterCount = Math.round(remainder);
                                  if (twoMeterCount > 0) (packlistaData.totals as any)['Truss 2m'] = ((packlistaData.totals as any)['Truss 2m'] || 0) + twoMeterCount;
                                  if (oneMeterCount > 0) (packlistaData.totals as any)['Truss 1m'] = ((packlistaData.totals as any)['Truss 1m'] || 0) + oneMeterCount;
                                  (packlistaData.totals as any)['Vajer upphängning'] = ((packlistaData.totals as any)['Vajer upphängning'] || 0) + 4;
                                  const lampCount = Math.round(frontWidth);
                                  if (lampCount > 0) (packlistaData.totals as any)['Trusslampa'] = ((packlistaData.totals as any)['Trusslampa'] || 0) + lampCount;
                                }
                              }
                            } catch (e) {
                              console.error('Fel vid förbättring av packlista:', e);
                            }
                            
                            // Spara de tre vyerna (ovanifrån, perspektiv, framifrån) i orderData.images
                            let orderImages: string[] = [];
                            if (captureRef.current && captureRef.current.captureViews) {
                              try {
                                orderImages = captureRef.current.captureViews(1200, 800);
                              } catch (e) {
                                // fallback: försök ta canvas
                                const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
                                if (canvasEl) {
                                  const imgData = canvasEl.toDataURL('image/jpeg', 0.7);
                                  orderImages = [imgData, imgData, imgData];
                                }
                              }
                            }
                            while (orderImages.length < 3) orderImages.push('');

                            const orderData: OrderData = {
                              floorSize: floorIndex !== null ? FLOOR_SIZES[floorIndex] : null,
                              wallConfig: {
                                shape: wallShape,
                                height: wallHeight,
                                width: floorIndex !== null ? FLOOR_SIZES[floorIndex].width : 0,
                                depth: floorIndex !== null ? FLOOR_SIZES[floorIndex].depth : 0
                              },
                              furniture: furniture.map(f => {
                                const config = FURNITURE_TYPES[f.type];
                                return {
                                  ...f,
                                  type: config?.label.toLowerCase().replace(/\s+/g, '') || 'unknown', // Konvertera till lowercase utan mellanslag
                                  color: config?.color || 0xcccccc
                                };
                              }), // Konvertera möbler med rätt typ-strängar
                              plants: plants.map(p => {
                                const config = PLANT_TYPES[p.type];
                                return {
                                  ...p,
                                  potColor: config?.color ? parseInt(config.color.replace('#', ''), 16) : 0x8B5A2B,
                                  leafColor: config?.leafColor ? parseInt(config.leafColor.replace('#', ''), 16) : 0x228B22
                                };
                              }), // Konvertera växter med färg-info
                              decorations: [], // Dekorationer (tom array tills vidare)
                              storages: storages.map(s => ({ ...s })), // Kopiera förråd
                              counters: counters.map(c => ({ ...c })), // Kopiera diskar
                              tvs: tvs.map(t => {
                                const config = TV_SIZES[t.size || 0];
                                return {
                                  ...t,
                                  width: config?.width || 0,
                                  height: config?.height || 0,
                                  color: 0x222244 // Default TV color
                                };
                              }), // Konvertera TV-apparater med dimensioner
                              totalPrice: totalCost,
                              packlista: packlistaData, // Spara hela den förbättrade packlistan
                              images: orderImages // Spara bilderna för admin/kund
                            };
                            
                            // Samla alla PDF-filer
                            const pdfBlob = pdf.output('blob');
                            const wallPDFs: { name: string; blob: Blob }[] = [];
                            const storagePDFs: { name: string; blob: Blob }[] = [];
                            
                            // Generera vägg-PDFer från VEPA designs
                            if (vepaWallDesigns.length > 0) {
                              console.log('📄 Genererar VEPA tryckfiler...');
                              for (const design of vepaWallDesigns) {
                                try {
                                  const designPDF = new jsPDF('portrait', 'mm', [design.widthMM, design.heightMM]);
                                  
                                  // Bakgrundsfärg
                                  if (design.backgroundColor && design.backgroundColorRGB) {
                                    designPDF.setFillColor(design.backgroundColorRGB);
                                    designPDF.rect(0, 0, design.widthMM, design.heightMM, 'F');
                                  }
                                  
                                  // Bakgrundsbild
                                  if (design.backgroundImage) {
                                    designPDF.addImage(design.backgroundImage, 'JPEG', 0, 0, design.widthMM, design.heightMM);
                                  }
                                  
                                  // Logo
                                  if (design.logo) {
                                    designPDF.addImage(
                                      design.logo.imageData,
                                      'PNG',
                                      design.logo.x,
                                      design.logo.y,
                                      design.logo.width,
                                      design.logo.height
                                    );
                                  }
                                  
                                  const designBlob = designPDF.output('blob');
                                  wallPDFs.push({
                                    name: `VEPA_${design.wallLabel}_${design.widthMM}x${design.heightMM}mm`,
                                    blob: designBlob
                                  });
                                } catch (err) {
                                  console.error('Fel vid generering av VEPA PDF:', err);
                                }
                              }
                            }
                            
                            // Generera vägg-PDFer från FOREX designs
                            if (forexWallDesigns.length > 0) {
                              console.log('📄 Genererar FOREX tryckfiler...');
                              for (const design of forexWallDesigns) {
                                try {
                                  const designPDF = new jsPDF('portrait', 'mm', [design.widthMM, design.heightMM]);
                                  
                                  if (design.backgroundColor && design.backgroundColorRGB) {
                                    designPDF.setFillColor(design.backgroundColorRGB);
                                    designPDF.rect(0, 0, design.widthMM, design.heightMM, 'F');
                                  }
                                  
                                  if (design.backgroundImage) {
                                    designPDF.addImage(design.backgroundImage, 'JPEG', 0, 0, design.widthMM, design.heightMM);
                                  }
                                  
                                  if (design.logo) {
                                    designPDF.addImage(
                                      design.logo.imageData,
                                      'PNG',
                                      design.logo.x,
                                      design.logo.y,
                                      design.logo.width,
                                      design.logo.height
                                    );
                                  }
                                  
                                  const designBlob = designPDF.output('blob');
                                  wallPDFs.push({
                                    name: `FOREX_${design.wallLabel}_${design.widthMM}x${design.heightMM}mm`,
                                    blob: designBlob
                                  });
                                } catch (err) {
                                  console.error('Fel vid generering av FOREX PDF:', err);
                                }
                              }
                            }
                            
                            // Generera förråds-PDFer
                            if (storageDesigns.size > 0) {
                              console.log('📄 Genererar förråds tryckfiler...');
                              storageDesigns.forEach((storageData, storageId) => {
                                storageData.designs.forEach((design) => {
                                  try {
                                    const designPDF = new jsPDF('portrait', 'mm', [design.widthMM, design.heightMM]);
                                    
                                    if (design.backgroundColor && design.backgroundColorRGB) {
                                      designPDF.setFillColor(design.backgroundColorRGB);
                                      designPDF.rect(0, 0, design.widthMM, design.heightMM, 'F');
                                    }
                                    
                                    if (design.backgroundImage) {
                                      designPDF.addImage(design.backgroundImage, 'JPEG', 0, 0, design.widthMM, design.heightMM);
                                    }
                                    
                                    if (design.logo) {
                                      designPDF.addImage(
                                        design.logo.imageData,
                                        'PNG',
                                        design.logo.x,
                                        design.logo.y,
                                        design.logo.width,
                                        design.logo.height
                                      );
                                    }
                                    
                                    const designBlob = designPDF.output('blob');
                                    storagePDFs.push({
                                      name: `Förråd${storageId}_${design.wallLabel}_${design.widthMM}x${design.heightMM}mm`,
                                      blob: designBlob
                                    });
                                  } catch (err) {
                                    console.error('Fel vid generering av förråds PDF:', err);
                                  }
                                });
                              });
                            }
                            
                            console.log(`✅ Genererade ${wallPDFs.length} vägg-PDFer och ${storagePDFs.length} förråds-PDFer`);
                            
                            const pdfFiles = {
                              mainPDF: pdfBlob,
                              wallPDFs: wallPDFs,
                              storagePDFs: storagePDFs
                            };
                            
                            // Spara beställningen med alla PDFer
                            const orderId = await OrderManager.saveOrder(customerInfo, orderData, pdfFiles);
                            console.log('✅ Beställning sparad med ID:', orderId);
                            console.log('📦 Beställningsdata:', { customerInfo, orderData, fileCount: wallPDFs.length + storagePDFs.length + 1 });
                          } catch (adminError) {
                            console.error('⚠️ Kunde inte spara till admin-portal:', adminError);
                            console.error('Detaljerat fel:', {
                              message: (adminError as any).message,
                              stack: (adminError as any).stack
                            });

                            // Diagnostisera localStorage
                            console.log('🔍 Diagnostiserar localStorage efter fel...');
                            // @ts-ignore - OrderManager har metoden
                            if (typeof OrderManager.diagnoseStorage === 'function') {
                              OrderManager.diagnoseStorage();
                            }

                            alert(`⚠️ Varning: Beställningen kunde inte sparas i admin-portalen.\n\nFel: ${(adminError as any).message}\n\nMailet skickades ändå. Kontakta support om problemet kvarstår.`);
                            // Fortsätt ändå, mailet är viktigast
                          }
                          
                          alert(`✅ Beställning skickad!\n\n� Mail skickat\n\n💾 PDF och alla tryckfiler sparade i admin-portalen\n\n� Logga in på admin-portalen för att ladda ner ZIP-fil`);
                          
                        } catch (error) {
                          console.error('Fel vid beställning:', error);
                          const err = error as any;
                          console.error('Error details:', {
                            message: err.message,
                            stack: err.stack,
                            name: err.name
                          });
                          alert(`❌ Ett fel uppstod vid sändning av beställningen: ${err.message || 'Okänt fel'}\n\nKontrollera konsolen för mer detaljer.`);
                        }
                      } catch (error) {
                        console.error('Fel vid beställning:', error);
                        const err = error as any;
                        console.error('Error details:', {
                          message: err.message,
                          stack: err.stack,
                          name: err.name
                        });
                        alert(`Ett fel uppstod vid sändning av beställningen: ${err.message || 'Okänt fel'}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 14
                    }}
                  >
                    📧 Beställ
                  </button>
                </div>
              </div>
            );
          })() : (
            <div style={{ fontSize: 18, color: '#666' }}>Välj monterstorlek för att se pris</div>
          )}
          
          <div style={{ 
            fontSize: 11, 
            color: '#666',
            lineHeight: '1.3',
            marginTop: 8
          }}>
            Pris exklusive moms. Frakt och eventuella hotellkostnader tillkommer.
            <br />
            Montern: {floorIndex !== null ? `${calculateLaborCosts().area}m²` : '-'}
          </div>
        </div>
      </div>
      )}
      
      {/* Mässmiljö-knapp i högra hörnet */}
      <button
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          fontSize: '12px',
          background: showExhibitionHall ? '#28a745' : '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 1000,
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        onClick={() => setShowExhibitionHall(!showExhibitionHall)}
      >
        {showExhibitionHall ? '🏢 Dölj mässhall' : '🏢 Visa mässhall'}
      </button>
      
  {/* 3D-scen */}
  <div className="canvas-container" style={{ 
    marginLeft: window.innerWidth <= 768 ? '50vw' : '320px', 
    width: window.innerWidth <= 768 ? '50vw' : 'calc(100vw - 320px)', 
    height: '100vh', 
    position: 'relative',
    background: '#f0f0f0',
    display: 'block'
  }}>
        {floorIndex === null ? (
          // Visa instruktioner när ingen monterstorlek är vald
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div>
              {window.innerWidth <= 768 ? (
                // Mobilversion - visa meddelande om utveckling
                <>
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.9)',
                    color: '#000',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    📱 Mobilversion under uppbyggnad<br />
                    För bästa upplevelse, använd desktop/dator
                  </div>
                  <h2 style={{ 
                    fontSize: '18px',
                    marginBottom: '10px',
                    fontWeight: '600'
                  }}>
                    Välkommen till Monterhyra! 🏗️
                  </h2>
                </>
              ) : (
                // Desktop version - vanlig välkomsttext
                <h2 style={{ 
                  fontSize: '24px',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Välkommen till Monterhyra! 🏗️
                </h2>
              )}
              <p style={{ 
                fontSize: window.innerWidth <= 768 ? '12px' : '16px',
                opacity: 0.9,
                maxWidth: '300px'
              }}>
                Välj en monterstorlek i menyn {window.innerWidth <= 768 ? 'till vänster' : ''} för att börja designa din 3D-monter
              </p>
            </div>
          </div>
        ) : (() => {
          // (vepa overlay removed)
          
          // Hjälpfunktion för att få rätt golvdimensioner
          const getFloorDimensions = () => {
            const floorConfig = FLOOR_SIZES[floorIndex];
            if (floorConfig?.custom) {
              return { width: customFloorWidth, depth: customFloorDepth };
            }
            return { width: floorConfig.width, depth: floorConfig.depth };
          };
          
          const floorDimensions = getFloorDimensions();
          
          return (
            <ErrorBoundary>
              <Canvas 
              camera={{ 
                position: window.innerWidth <= 768 ? [0, 4, 10] : [0, 2, 6], // Zooma ut mer på mobil
                fov: window.innerWidth <= 768 ? 75 : 50 // Mycket bredare synfält på mobil
              }} 
              shadows
              gl={{ preserveDrawingBuffer: true }}
              style={{ background: '#f0f0f0' }} // Säkerställ synlig bakgrund
            >
            <CaptureHelper ref={captureRef} onHideGrid={setHideGridForCapture} />
            {/* Visa golvplatta - dölj under PDF-generering */}
            {!hideGridForCapture && <Grid args={[20, 20]} cellColor="#bbb" sectionColor="#888" fadeDistance={20} position={[0, 0, 0]} />}
            
            {/* ÅTERGÅ TILL FUNGERANDE BELYSNING */}
            {showExhibitionHall ? (
              <>
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 10, 5]} intensity={0.3} />
              </>
            ) : (
              <>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 5]} intensity={0.5} />
              </>
            )}
            
            {/* Mässhallsmiljö - visas bara när showExhibitionHall är true */}
            {showExhibitionHall && (
              <>
                {/* PREMIUM MÄSSGOLV - Polerat betong-look */}
                <mesh position={[0, -0.02, 0]} receiveShadow>
                  <boxGeometry args={[100, 0.04, 100]} />
                  <meshPhysicalMaterial 
                    color="#e8e8e8" 
                    roughness={0.2}
                    metalness={0.1}
                    clearcoat={0.8}
                    reflectivity={0.3}
                  />
                </mesh>
                
                {/* Mässgolv detaljer - Texturerade sektioner */}
                {[-40, -20, 0, 20, 40].map((x, i) => 
                  [-40, -20, 0, 20, 40].map((z, j) => (
                    <mesh key={`floor-${i}-${j}`} position={[x, -0.015, z]} receiveShadow>
                      <boxGeometry args={[18, 0.01, 18]} />
                      <meshPhysicalMaterial 
                        color="#f2f2f2" 
                        roughness={0.3}
                        metalness={0.0}
                      />
                    </mesh>
                  ))
                )}
                
                {/* INDUSTRIELLA HÖGA VÄGGAR - Dubbelt så höga (8m) */}
                {/* Fram-vägg */}
                <mesh position={[0, 4, 50]} castShadow>
                  <boxGeometry args={[100, 8, 0.2]} />
                  <meshStandardMaterial color="#d5d5d5" roughness={0.8} metalness={0.1} />
                </mesh>
                
                {/* Bak-vägg */}
                <mesh position={[0, 4, -50]} castShadow>
                  <boxGeometry args={[100, 8, 0.2]} />
                  <meshStandardMaterial color="#d5d5d5" roughness={0.8} metalness={0.1} />
                </mesh>
                
                {/* Vänster vägg */}
                <mesh position={[-50, 4, 0]} castShadow>
                  <boxGeometry args={[0.2, 8, 100]} />
                  <meshStandardMaterial color="#d5d5d5" roughness={0.8} metalness={0.1} />
                </mesh>
                
                {/* Höger vägg */}
                <mesh position={[50, 4, 0]} castShadow>
                  <boxGeometry args={[0.2, 8, 100]} />
                  <meshStandardMaterial color="#d5d5d5" roughness={0.8} metalness={0.1} />
                </mesh>
                
                {/* INDUSTRIELL MÄSSBELYSNING - Högt upp över väggarna (12m höjd) */}
                {/* Spotlight rad 1 - längs fram-sidan */}
                <spotLight
                  position={[-30, 12, 40]}
                  target-position={[-30, 0, 0]}
                  intensity={200}
                  angle={Math.PI / 6}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                <spotLight
                  position={[0, 12, 40]}
                  target-position={[0, 0, 0]}
                  intensity={200}
                  angle={Math.PI / 6}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                <spotLight
                  position={[30, 12, 40]}
                  target-position={[30, 0, 0]}
                  intensity={200}
                  angle={Math.PI / 6}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                
                {/* Spotlight rad 2 - längs mitten */}
                <spotLight
                  position={[-20, 12, 0]}
                  target-position={[-20, 0, 0]}
                  intensity={180}
                  angle={Math.PI / 5}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                <spotLight
                  position={[20, 12, 0]}
                  target-position={[20, 0, 0]}
                  intensity={180}
                  angle={Math.PI / 5}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                
                {/* Spotlight rad 3 - längs bak-sidan */}
                <spotLight
                  position={[-30, 12, -40]}
                  target-position={[-30, 0, 0]}
                  intensity={200}
                  angle={Math.PI / 6}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                <spotLight
                  position={[30, 12, -40]}
                  target-position={[30, 0, 0]}
                  intensity={200}
                  angle={Math.PI / 6}
                  penumbra={0.3}
                  distance={50}
                  color="#ffffff"
                  castShadow
                />
                
                {/* Metalliska lamparmatur - Industriell känsla */}
                {[
                  [-30, 40], [0, 40], [30, 40],  // Fram-rad
                  [-20, 0], [20, 0],             // Mitt-rad  
                  [-30, -40], [30, -40]          // Bak-rad
                ].map(([x, z], index) => (
                  <group key={`fixture-${index}`} position={[x, 11.5, z]}>
                    {/* Metallisk lamphållare */}
                    <mesh>
                      <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
                      <meshPhysicalMaterial 
                        color="#2a2a2a" 
                        roughness={0.3} 
                        metalness={0.9}
                      />
                    </mesh>
                    {/* Kabel uppåt */}
                    <mesh position={[0, 1, 0]}>
                      <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
                      <meshStandardMaterial color="#000" />
                    </mesh>
                  </group>
                ))}
                
                {/* Ljusa monterplatser - UTÖKAD LAYOUT MED GÅNGAR */}
                {/* Rad 1 - Vänster sida */}
                <mesh position={[-35, 0.01, -30]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[-35, 0.01, -15]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[-35, 0.01, 0]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[-35, 0.01, 15]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[-35, 0.01, 30]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                
                {/* Rad 2 - Mitt-vänster (vår huvudmontör här) */}
                <mesh position={[-15, 0.01, -30]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 8]} />
                  <meshStandardMaterial color="#e6f3ff" roughness={0.3} />
                </mesh>
                {/* Tom plats för huvudmontör - här renderas vår designade montör */}
                <mesh position={[-15, 0.01, 15]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[-15, 0.01, 30]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 8]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                
                {/* Rad 3 - Centrum (tom gång) */}
                {/* Ingen montör här - öppen gång för rörelse */}
                
                {/* Rad 4 - Mitt-höger */}
                <mesh position={[15, 0.01, -30]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 8]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[15, 0.01, -10]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[15, 0.01, 10]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[15, 0.01, 30]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 8]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                
                {/* Rad 5 - Höger sida */}
                <mesh position={[35, 0.01, -30]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[35, 0.01, -15]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[35, 0.01, 0]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[35, 0.01, 15]} receiveShadow>
                  <boxGeometry args={[8, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                <mesh position={[35, 0.01, 30]} receiveShadow>
                  <boxGeometry args={[6, 0.02, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                
                {/* GÅNG-MARKERINGAR - Grå banor mellan montrar */}
                {/* Huvudgång genom mitten (nord-syd) */}
                <mesh position={[0, 0.005, 0]} receiveShadow>
                  <boxGeometry args={[8, 0.01, 80]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                
                {/* Tvärsgångar (öst-väst) */}
                <mesh position={[-25, 0.005, -30]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                <mesh position={[25, 0.005, -30]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                
                <mesh position={[-25, 0.005, 0]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                <mesh position={[25, 0.005, 0]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                
                <mesh position={[-25, 0.005, 30]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>
                <mesh position={[25, 0.005, 30]} receiveShadow>
                  <boxGeometry args={[20, 0.01, 4]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
                </mesh>

                {/* RENDER BOOTH TEMPLATES PÅ MÄSSHALLSPLATSER */}
                {Object.entries(exhibitionBooths).map(([boothId, templateId]) => {
                  const template = EXHIBITION_BOOTH_TEMPLATES.find(t => t.id === templateId);
                  if (!template) return null;
                  
                  // Booth positioner baserat på booth ID
                  const boothPositions: { [key: string]: { x: number, z: number } } = {
                    'booth-1': { x: -35, z: -30 },
                    'booth-2': { x: -35, z: -15 }, 
                    'booth-3': { x: -35, z: 0 },
                    'booth-4': { x: -35, z: 15 },
                    'booth-5': { x: -35, z: 30 },
                    'booth-6': { x: -15, z: -30 },
                    'booth-7': { x: -15, z: 15 },
                    'booth-8': { x: -15, z: 30 },
                    'booth-9': { x: 15, z: -30 },
                    'booth-10': { x: 15, z: -10 },
                    'booth-11': { x: 15, z: 10 },
                    'booth-12': { x: 15, z: 30 },
                    'booth-13': { x: 35, z: -30 },
                    'booth-14': { x: 35, z: -15 },
                    'booth-15': { x: 35, z: 0 },
                    'booth-16': { x: 35, z: 15 },
                    'booth-17': { x: 35, z: 30 }
                  };
                  
                  const position = boothPositions[boothId];
                  if (!position) return null;
                  
                  return (
                    <ExhibitionBoothRenderer 
                      key={boothId}
                      booth={template}
                      position={position}
                      selectedTrussType={selectedTrussType}
                      floorIndex={floorIndex}
                      customFloorWidth={customFloorWidth}
                      customFloorDepth={customFloorDepth}
                    />
                  );
                })}
              </>
            )}
            
            <Floor 
              width={floorDimensions.width} 
              depth={floorDimensions.depth} 
            />
            
            {carpetIndex !== 0 && CARPET_COLORS[carpetIndex].color && (
              <Carpet width={floorDimensions.width} depth={floorDimensions.depth} color={CARPET_COLORS[carpetIndex].color as string} />
            )}
            
            {/* Disk placering markörer - visa gröna rutor på halvmeter precision */}
            {wallShape && wallShape !== '' && counterMarkersVisible && (() => {
              const floor = floorDimensions;
              const markers = [];
              
              // Skapa markörer för varje halvmeter (finare precision för diskar)
              for (let x = 0; x < floor.width * 2; x++) {
                for (let z = 0; z < floor.depth * 2; z++) {
                  const posX = x * 0.5 - floor.width/2 + 0.25;
                  const posZ = z * 0.5 - floor.depth/2 + 0.25;
                  
                  markers.push(
                    <mesh
                      key={`counter-marker-${x}-${z}`}
                      position={[posX, 0.13, posZ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      onClick={() => {
                        console.log('🟢 Disk marker clicked!', { floorIndex, selectedCounterType });
                        // Skapa disk direkt med vald typ
                        if (!floorIndex || selectedCounterType <= 0) {
                          console.warn('❌ Cannot place counter:', { floorIndex, selectedCounterType });
                          return;
                        }
                        
                        const counterConfig = COUNTER_TYPES[selectedCounterType];
                        console.log('✅ Counter config:', counterConfig);
                        const floor = FLOOR_SIZES[floorIndex];
                        const actualWidth = floor.custom ? customFloorWidth : floor.width;
                        const actualDepth = floor.custom ? customFloorDepth : floor.depth;
                        
                        // Kontrollera att disken passar inom monterområdet
                        let canPlace = true;
                        if (counterConfig.type === 'L' || counterConfig.type === 'L-mirrored') {
                          // L-formad disk: kontrollera både delar
                          const maxX = actualWidth / 2;
                          const minX = -actualWidth / 2;
                          const maxZ = actualDepth / 2;
                          const minZ = -actualDepth / 2;
                          
                          // Kontrollera första delen (1,5m x 0,5m)
                          if (posX + 0.75 > maxX || posX - 0.75 < minX || 
                              posZ + 0.25 > maxZ || posZ - 0.25 < minZ) {
                            canPlace = false;
                          }
                          
                          // Kontrollera andra delen beroende på typ
                          if (counterConfig.type === 'L') {
                            // Vanlig L: andra delen åt höger
                            if (posX + 1.25 > maxX || posZ + 0.75 > maxZ || posZ - 0.75 < minZ) {
                              canPlace = false;
                            }
                          } else {
                            // Spegelvänd L: andra delen åt vänster
                            if (posX - 1.25 < minX || posZ + 0.75 > maxZ || posZ - 0.75 < minZ) {
                              canPlace = false;
                            }
                          }
                        } else {
                          // Vanlig rak disk
                          const maxX = actualWidth / 2 - counterConfig.width / 2;
                          const minX = -actualWidth / 2 + counterConfig.width / 2;
                          const maxZ = actualDepth / 2 - counterConfig.depth / 2;
                          const minZ = -actualDepth / 2 + counterConfig.depth / 2;
                          
                          if (posX > maxX || posX < minX || posZ > maxZ || posZ < minZ) {
                            canPlace = false;
                          }
                        }
                        
                        if (canPlace && selectedCounterType > 0) {
                          console.log('✅ Placing counter at:', { posX, posZ });
                          setCounters(prev => [...prev, {
                            id: nextCounterId,
                            type: COUNTER_TYPES[selectedCounterType].label,
                            position: {x: posX, z: posZ},
                            rotation: 0
                          }]);
                          setNextCounterId(prev => prev + 1);
                        } else {
                          console.warn('❌ Cannot place - out of bounds or invalid type');
                        }
                      }}
                    >
                      <planeGeometry args={[0.4, 0.4]} />
                      <meshBasicMaterial color="#1ec94c" opacity={0.3} transparent />
                    </mesh>
                  );
                }
              }
              
              return <>{markers}</>;
            })()}

            {/* Förråd placering markörer - visa blå rutor bara i framre hörnen */}
            {wallShape && wallShape !== '' && storageMarkersVisible && (() => {
              const floor = floorDimensions;
              const storageMarkers: React.ReactElement[] = [];
              
              // Skapa markörer endast i de två framre hörnen
              const frontCorners = [
                {x: 0, z: 0}, // Hörn vänster fram
                {x: floor.width - 1, z: 0}, // Hörn höger fram  
              ];
              
              frontCorners.forEach((corner) => {
                const posX = corner.x - floor.width/2 + 0.5;
                const posZ = corner.z - floor.depth/2 + 0.5;
                
                storageMarkers.push(
                  <mesh
                    key={`storage-marker-${corner.x}-${corner.z}`}
                    position={[posX, 0.14, posZ]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onClick={() => {
                      console.log('🔵 Storage marker clicked!', { posX, posZ, floorIndex, selectedStorageType });
                      // Skapa förråd direkt med vald typ
                      if (!floorIndex || selectedStorageType <= 0) {
                        console.warn('❌ Cannot place storage:', { floorIndex, selectedStorageType });
                        return;
                      }
                      
                      const floor = FLOOR_SIZES[floorIndex];
                      const actualWidth = floor.custom ? customFloorWidth : floor.width;
                      const actualDepth = floor.custom ? customFloorDepth : floor.depth;
                      const storageConfig = STORAGE_TYPES[selectedStorageType];
                      
                      console.log('✅ Storage config:', storageConfig, 'Floor:', { actualWidth, actualDepth });
                      
                      // Justera position så förrådet håller sig inom monterområdet
                      let adjustedX = posX;
                      let adjustedZ = posZ;
                      
                      // Kontrollera och justera X-position
                      const maxX = actualWidth / 2 - storageConfig.width / 2;
                      const minX = -actualWidth / 2 + storageConfig.width / 2;
                      if (adjustedX > maxX) adjustedX = maxX;
                      if (adjustedX < minX) adjustedX = minX;
                      
                      // Kontrollera och justera Z-position
                      const maxZ = actualDepth / 2 - storageConfig.depth / 2;
                      const minZ = -actualDepth / 2 + storageConfig.depth / 2;
                      if (adjustedZ > maxZ) adjustedZ = maxZ;
                      if (adjustedZ < minZ) adjustedZ = minZ;
                      
                      console.log('📍 Placing storage at:', { adjustedX, adjustedZ });
                      
                      setStorages(prev => [...prev, {
                        id: nextStorageId,
                        type: selectedStorageType,
                        position: {x: adjustedX, z: adjustedZ},
                        rotation: 0
                      }]);
                      setNextStorageId(prev => prev + 1);
                    }}
                  >
                    <planeGeometry args={[0.8, 0.8]} />
                    <meshBasicMaterial color="#4169E1" opacity={0.3} transparent />
                  </mesh>
                );
              });
              
              return <>{storageMarkers}</>;
            })()}

            {/* Växt placering markörer - visa gröna rutor på hela golvet */}
            {wallShape && wallShape !== '' && plantMarkersVisible && (() => {
              const floor = floorDimensions;
              const plantMarkers = [];
              
              // Skapa markörer för varje golvplatta
              for (let x = 0; x < floor.width; x++) {
                for (let z = 0; z < floor.depth; z++) {
                  const posX = x - floor.width/2 + 0.5;
                  const posZ = z - floor.depth/2 + 0.5;
                  
                  // Kontrollera att positionen inte kolliderar med förråd, diskar eller TVs
                  const hasCollision = storages.some(storage => {
                    const storageConfig = STORAGE_TYPES[storage.type];
                    const isRotated = storage.rotation === 90 || storage.rotation === 270;
                    const effectiveWidth = isRotated ? storageConfig.depth : storageConfig.width;
                    const effectiveDepth = isRotated ? storageConfig.width : storageConfig.depth;
                    
                    return Math.abs(posX - storage.position.x) < effectiveWidth/2 + 0.3 &&
                           Math.abs(posZ - storage.position.z) < effectiveDepth/2 + 0.3;
                  }) || counters.some(counter => {
                    const counterConfig = COUNTER_TYPES.find(ct => ct.label === counter.type);
                    if (!counterConfig) return false;
                    if (counterConfig.type === 'L') {
                      // L-formad disk kollision
                      return Math.abs(posX - counter.position.x) < 1.0 &&
                             Math.abs(posZ - counter.position.z) < 1.0;
                    } else if (counterConfig.type === 'L-mirrored') {
                      // Spegelvänd L-formad disk kollision
                      return Math.abs(posX - counter.position.x) < 1.0 &&
                             Math.abs(posZ - counter.position.z) < 1.0;
                    } else {
                      return Math.abs(posX - counter.position.x) < counterConfig.width/2 + 0.3 &&
                             Math.abs(posZ - counter.position.z) < counterConfig.depth/2 + 0.3;
                    }
                  });
                  
                  if (!hasCollision) {
                    plantMarkers.push(
                      <mesh
                        key={`plant-marker-${x}-${z}`}
                        position={[posX, 0.15, posZ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        onClick={() => {
                          // Skapa växt direkt med vald typ
                          setPlants(prev => [...prev, {
                            id: nextPlantId,
                            type: selectedPlantType,
                            position: {x: posX, z: posZ},
                            rotation: 0
                          }]);
                          setNextPlantId(prev => prev + 1);
                        }}
                      >
                        <planeGeometry args={[0.6, 0.6]} />
                        <meshBasicMaterial color="#32CD32" opacity={0.4} transparent />
                      </mesh>
                    );
                  }
                }
              }
              
              return <>{plantMarkers}</>;
            })()}

            {/* Möbel placering markörer - visa blåa rutor på hela golvet */}
            {wallShape && wallShape !== '' && furnitureMarkersVisible && (() => {
              const floor = floorDimensions;
              const furnitureMarkers = [];
              
              // Skapa markörer för varje halv-meter (finare precision för möbler)
              for (let x = 0; x < floor.width * 2; x++) {
                for (let z = 0; z < floor.depth * 2; z++) {
                  const posX = x * 0.5 - floor.width/2 + 0.25;
                  const posZ = z * 0.5 - floor.depth/2 + 0.25;
                  
                  // Kontrollera att positionen inte kolliderar med förråd, diskar eller TVs
                  const hasCollision = storages.some(storage => {
                    const storageConfig = STORAGE_TYPES[storage.type];
                    const isRotated = storage.rotation === 90 || storage.rotation === 270;
                    const effectiveWidth = isRotated ? storageConfig.depth : storageConfig.width;
                    const effectiveDepth = isRotated ? storageConfig.width : storageConfig.depth;
                    
                    return Math.abs(posX - storage.position.x) < effectiveWidth/2 + 0.2 &&
                           Math.abs(posZ - storage.position.z) < effectiveDepth/2 + 0.2;
                  }) || counters.some(counter => {
                    const counterConfig = COUNTER_TYPES.find(ct => ct.label === counter.type);
                    if (!counterConfig) return false;
                    if (counterConfig.type === 'L') {
                      // L-formad disk kollision
                      return Math.abs(posX - counter.position.x) < 0.8 &&
                             Math.abs(posZ - counter.position.z) < 0.8;
                    } else if (counterConfig.type === 'L-mirrored') {
                      // Spegelvänd L-formad disk kollision
                      return Math.abs(posX - counter.position.x) < 0.8 &&
                             Math.abs(posZ - counter.position.z) < 0.8;
                    } else {
                      return Math.abs(posX - counter.position.x) < counterConfig.width/2 + 0.2 &&
                             Math.abs(posZ - counter.position.z) < counterConfig.depth/2 + 0.2;
                    }
                  });
                  
                  if (!hasCollision) {
                    furnitureMarkers.push(
                      <mesh
                        key={`furniture-marker-${x}-${z}`}
                        position={[posX, 0.15, posZ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        onClick={() => {
                          // Skapa möbel direkt med vald typ
                          setFurniture(prev => [...prev, {
                            id: nextFurnitureId,
                            type: selectedFurnitureType,
                            position: {x: posX, z: posZ},
                            rotation: 0
                          }]);
                          setNextFurnitureId(prev => prev + 1);
                        }}
                      >
                        <planeGeometry args={[0.2, 0.2]} />
                        <meshBasicMaterial color="#4169E1" opacity={0.4} transparent />
                      </mesh>
                    );
                  }
                }
              }
              
              return <>{furnitureMarkers}</>;
            })()}

            {/* Väggar centrerade */}
            {wallShape && wallShape !== '' && (() => {
              const floor = floorDimensions;
              let wallColor = '#cccccc';
              let wallMaterial = 'standard';
              if (graphic === 'hyr') {
                wallColor = '#fff';
                wallMaterial = 'standard';
              } else if (graphic === 'vepa') {
                wallColor = '#d3d3d3'; // ljusgrå
                wallMaterial = 'standard';
              } else if (graphic === 'forex') {
                wallColor = '#d3d3d3'; // ljusgrå
                wallMaterial = 'standard';
              } else {
                wallColor = '#888'; // grå när inget val är gjort
                wallMaterial = 'standard';
              }
              const thickness = 0.065;
              const height = wallHeight;
              // const offset = 0.065; // ej använd
              const makeWallSections = (start: [number, number, number], dir: [number, number, number], length: number, rotY: number) => {
                const sections = [];
                const n = Math.ceil(length);
                const actualWallColor = wallColor;
                for (let i = 0; i < n; i++) {
                  let segLength = 1;
                  if (i === n - 1) {
                    segLength = length - (n - 1);
                  }
                  const y = height/2 + 0.06; // Golvet är 0.12 tjockt på Y=0, så toppen är på 0.06
                  const pos: [number, number, number] = [
                    start[0] + dir[0] * (i + segLength/2),
                    y,
                    start[2] + dir[2] * (i + segLength/2)
                  ];
                  const Material = wallMaterial === 'basic' ? 'meshBasicMaterial' : 'meshStandardMaterial';
                  const thinWall = thickness / 2;
                  
                  // Lägg till transparens när ingen grafik är vald
                  const isTransparent = graphic === 'none';
                  const opacity = isTransparent ? 0.05 : 1.0;
                  
                  if (rotY === 0) {
                    // Bakvägg: Insidan (mot montern) är +Z, utsidan är -Z
                    // Färgad sida (insidan) - mot montern
                    
                    sections.push(
                      <mesh key={rotY + '-' + i + '-inside'} position={[pos[0], pos[1], pos[2] + thinWall/2]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[segLength, height, thinWall]} />
                        {Material === 'meshBasicMaterial' ? (
                          <meshBasicMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                        ) : (
                          <meshStandardMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                        )}
                      </mesh>
                    );
                    // Vit sida (utsidan)
                    sections.push(
                      <mesh key={rotY + '-' + i + '-outside'} position={[pos[0], pos[1], pos[2] - thinWall/2]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[segLength, height, thinWall]} />
                        {Material === 'meshBasicMaterial' ? (
                          <meshBasicMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                        ) : (
                          <meshStandardMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                        )}
                      </mesh>
                    );
                  } else {
                    // Sidoväggar: För vänstervägg är insidan +X, för högervägg är insidan -X
                    // Vi behöver veta vilken vägg det är baserat på startposition
                    const isLeftWall = start[0] < 0; // Vänstervägg har negativ X-startposition
                    
                    if (isLeftWall) {
                      // Vänstervägg: insidan är +X (mot mitten av montern)
                      sections.push(
                        <mesh key={rotY + '-' + i + '-inside'} position={[pos[0] + thinWall/2, pos[1], pos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[segLength, height, thinWall]} />
                          {Material === 'meshBasicMaterial' ? (
                            <meshBasicMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                          ) : (
                            <meshStandardMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                          )}
                        </mesh>
                      );
                      // Utsidan är -X
                      sections.push(
                        <mesh key={rotY + '-' + i + '-outside'} position={[pos[0] - thinWall/2, pos[1], pos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[segLength, height, thinWall]} />
                          {Material === 'meshBasicMaterial' ? (
                            <meshBasicMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                          ) : (
                            <meshStandardMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                          )}
                        </mesh>
                      );
                    } else {
                      // Högervägg: insidan är -X (mot mitten av montern)
                      sections.push(
                        <mesh key={rotY + '-' + i + '-inside'} position={[pos[0] - thinWall/2, pos[1], pos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[segLength, height, thinWall]} />
                          {Material === 'meshBasicMaterial' ? (
                            <meshBasicMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                          ) : (
                            <meshStandardMaterial color={actualWallColor} transparent={isTransparent} opacity={opacity} />
                          )}
                        </mesh>
                      );
                      // Utsidan är +X
                      sections.push(
                        <mesh key={rotY + '-' + i + '-outside'} position={[pos[0] + thinWall/2, pos[1], pos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[segLength, height, thinWall]} />
                          {Material === 'meshBasicMaterial' ? (
                            <meshBasicMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                          ) : (
                            <meshStandardMaterial color="#fff" transparent={isTransparent} opacity={opacity} />
                          )}
                        </mesh>
                      );
                    }
                  }
                }
                
                // Lägg till skarvlinjer på BÅDE insidan och utsidan av alla väggtyper (6mm silver/grå streck mellan varje meter)
                const seamWidth = 0.006; // 6mm i meter
                const seamColor = "#c0c0c0"; // Silver/grå färg
                
                // Lägg till vertikala skarvlinjer mellan varje meter på BÅDA SIDOR av väggen
                for (let i = 1; i < n; i++) {
                  const seamY = height/2 + 0.06;
                  const seamPos: [number, number, number] = [
                    start[0] + dir[0] * i,
                    seamY,
                    start[2] + dir[2] * i
                  ];
                  
                  if (rotY === 0) {
                    // Bakvägg: Vertikal skarv på INSIDAN (positiv Z-riktning)
                    sections.push(
                      <mesh key={rotY + '-seam-inside-' + i} position={[seamPos[0], seamPos[1], seamPos[2] + thickness/4 + 0.001]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[seamWidth, height, thickness/2]} />
                        <meshStandardMaterial color={seamColor} />
                      </mesh>
                    );
                    // Bakvägg: Vertikal skarv på UTSIDAN (negativ Z-riktning)
                    sections.push(
                      <mesh key={rotY + '-seam-outside-' + i} position={[seamPos[0], seamPos[1], seamPos[2] - thickness/4 - 0.001]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[seamWidth, height, thickness/2]} />
                        <meshStandardMaterial color={seamColor} />
                      </mesh>
                    );
                  } else {
                    // Sidoväggar: Vertikala skarvar på BÅDA SIDOR
                    const isLeftWall = start[0] < 0;
                    
                    if (isLeftWall) {
                      // Vänstervägg: INSIDAN (positiv X) och UTSIDAN (negativ X)
                      sections.push(
                        <mesh key={rotY + '-seam-inside-' + i} position={[seamPos[0] + thickness/4 + 0.001, seamPos[1], seamPos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[seamWidth, height, thickness/2]} />
                          <meshStandardMaterial color={seamColor} />
                        </mesh>
                      );
                      sections.push(
                        <mesh key={rotY + '-seam-outside-' + i} position={[seamPos[0] - thickness/4 - 0.001, seamPos[1], seamPos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[seamWidth, height, thickness/2]} />
                          <meshStandardMaterial color={seamColor} />
                        </mesh>
                      );
                    } else {
                      // Högervägg: INSIDAN (negativ X) och UTSIDAN (positiv X)
                      sections.push(
                        <mesh key={rotY + '-seam-inside-' + i} position={[seamPos[0] - thickness/4 - 0.001, seamPos[1], seamPos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[seamWidth, height, thickness/2]} />
                          <meshStandardMaterial color={seamColor} />
                        </mesh>
                      );
                      sections.push(
                        <mesh key={rotY + '-seam-outside-' + i} position={[seamPos[0] + thickness/4 + 0.001, seamPos[1], seamPos[2]]} rotation={[0, Math.PI/2, 0]}>
                          <boxGeometry args={[seamWidth, height, thickness/2]} />
                          <meshStandardMaterial color={seamColor} />
                        </mesh>
                      );
                    }
                  }
                }
                
                return sections;
              };
              // 🔥 FÖRBÄTTRAT TV-POSITIONERINGSSYSTEM - Fler positioner och höjder
              const tvHeights = [
                { name: 'hög', y: height * 0.75 + 0.1, label: 'H' },     // Hög position (75% upp på väggen)
                { name: 'mellan', y: height * 0.5 + 0.06, label: 'M' }   // Mellan position (ursprunglig)
              ];
              
              const boxSize = 0.4; // Mindre storlek för fler positioner
              const gap = 0.25;    // Mindre mellanrum för fler positioner
              
              // Funktion för att räkna ut hur många platser som får plats på en vägg (fler positioner)
              const getSpots = (length: number) => {
                const n = Math.floor((length + gap) / (boxSize + gap));
                return Math.max(2, n); // Minst 2 positioner per vägg
              };
              // Antal platser per vägg
              const spotsBack = getSpots(floor.width);
              const spotsLeft = getSpots(floor.depth);
              const spotsRight = getSpots(floor.depth);

              // StartX för varje vägg
              const calcWallStartX = (spots: number) => {
                const totalWidth = spots * boxSize + (spots - 1) * gap;
                return -totalWidth / 2 + boxSize / 2;
              };

              // Hjälpfunktion för att rendera TV på en vägg, endast om väggen finns
              const wallExists = (wall: 'back'|'left'|'right') => {
                if (wallShape === 'straight') return wall === 'back';
                if (wallShape === 'l') return wall === 'back' || wall === 'left';
                if (wallShape === 'u') return true;
                return false;
              };

              const renderTVs = (wall: 'back'|'left'|'right') => {
                if (!wallExists(wall)) return null;
                let spots = wall === 'back' ? spotsBack : wall === 'left' ? spotsLeft : spotsRight;
                let wallStartX = calcWallStartX(spots);
                
                return tvs
                  .filter(tv => tv.wall === wall)
                  .map((tv) => {
                    const tvConfig = TV_SIZES[tv.size];
                    const tvLabel = tvConfig.label === 'Ingen' ? '' : `TV${tvConfig.label.replace(/"/g, '')}`;
                    const heightConfig = tvHeights[tv.heightIndex];
                    
                    let position: [number, number, number];
                    let rotation: [number, number, number] = [0, 0, 0];
                    if (wall === 'back') {
                      // Justera positionering för 75" beTV - mindre aggressiv för att inte försvinna i trycket
                      const zOffset = tvConfig.label === '75" beTV' ? -(floor.depth/2) + 0.065 - 0.005 : -(floor.depth/2) + 0.065 + 0.025;
                      position = [wallStartX + tv.position * (boxSize + gap), heightConfig.y, zOffset];
                    } else if (wall === 'left') {
                      // Justera positionering för 75" beTV på vänster vägg
                      const xOffset = tvConfig.label === '75" beTV' ? -(floor.width/2) + 0.065 - 0.005 : -(floor.width/2) + 0.065 + 0.025;
                      position = [xOffset, heightConfig.y, wallStartX + tv.position * (boxSize + gap)];
                      rotation = [0, Math.PI/2, 0];
                    } else {
                      // Justera positionering för 75" beTV på höger vägg
                      const xOffset = tvConfig.label === '75" beTV' ? (floor.width/2) - 0.065 + 0.005 : (floor.width/2) - 0.065 - 0.025;
                      position = [xOffset, heightConfig.y, wallStartX + tv.position * (boxSize + gap)];
                      rotation = [0, -Math.PI/2, 0];
                    }
                    
                    return (
                      <group key={tv.id}>
                        <mesh
                          position={position}
                          rotation={rotation}
                          onDoubleClick={() => {
                            setTvs(prev => prev.map(t => {
                              if (t.id === tv.id) {
                                const newOrientation = t.orientation === 'landscape' ? 'portrait' : 'landscape';
                                const tvConfig = TV_SIZES[t.size];
                                const currentHeightConfig = tvHeights[t.heightIndex];
                                
                                // Beräkna TV:ns dimensioner i det nya läget
                                const tvWidth = newOrientation === 'portrait' ? tvConfig.height : tvConfig.width;
                                const tvHeight = newOrientation === 'portrait' ? tvConfig.width : tvConfig.height;
                                const halfTvWidth = tvWidth / 2;
                                const halfTvHeight = tvHeight / 2;
                                
                                // Kontrollera om TV:n sticker ut över väggkanten (vertikalt)
                                const topEdge = currentHeightConfig.y + halfTvHeight;
                                const maxAllowedHeight = height - 0.1; // Lite marginal från toppen
                                
                                // Kontrollera om TV:n sticker ut över väggkanten (horisontellt)
                                let wallLength = 0;
                                if (wall === 'back') {
                                  wallLength = floor.width;
                                } else {
                                  wallLength = floor.depth;
                                }
                                
                                const wallStartX = calcWallStartX(wall === 'back' ? spotsBack : wall === 'left' ? spotsLeft : spotsRight);
                                const currentTvCenterX = wallStartX + t.position * (boxSize + gap);
                                const leftEdge = currentTvCenterX - halfTvWidth;
                                const rightEdge = currentTvCenterX + halfTvWidth;
                                const wallLeftEdge = -wallLength / 2;
                                const wallRightEdge = wallLength / 2;
                                
                                let newHeightIndex = t.heightIndex;
                                let newPosition = t.position;
                                
                                // Om TV:n sticker ut över väggen vertikalt, flytta ner den
                                if (topEdge > maxAllowedHeight) {
                                  for (let i = tvHeights.length - 1; i >= 0; i--) {
                                    const testHeight = tvHeights[i].y + halfTvHeight;
                                    if (testHeight <= maxAllowedHeight) {
                                      newHeightIndex = i;
                                      break;
                                    }
                                  }
                                }
                                
                                // Om TV:n sticker ut över väggen horisontellt, flytta den
                                if (leftEdge < wallLeftEdge || rightEdge > wallRightEdge) {
                                  // Hitta den position som centrerar TV:n bäst inom väggen
                                  const spots = wall === 'back' ? spotsBack : wall === 'left' ? spotsLeft : spotsRight;
                                  let bestPosition = t.position;
                                  let bestFit = false;
                                  
                                  // Testa alla positioner och hitta den som fungerar bäst
                                  for (let pos = 0; pos < spots; pos++) {
                                    const testCenterX = wallStartX + pos * (boxSize + gap);
                                    const testLeftEdge = testCenterX - halfTvWidth;
                                    const testRightEdge = testCenterX + halfTvWidth;
                                    
                                    if (testLeftEdge >= wallLeftEdge && testRightEdge <= wallRightEdge) {
                                      bestPosition = pos;
                                      bestFit = true;
                                      break;
                                    }
                                  }
                                  
                                  if (bestFit) {
                                    newPosition = bestPosition;
                                  } else {
                                    // Om ingen position fungerar, försök hitta den som sticker ut minst
                                    let minOverhang = Infinity;
                                    for (let pos = 0; pos < spots; pos++) {
                                      const testCenterX = wallStartX + pos * (boxSize + gap);
                                      const testLeftEdge = testCenterX - halfTvWidth;
                                      const testRightEdge = testCenterX + halfTvWidth;
                                      const overhang = Math.max(0, wallLeftEdge - testLeftEdge) + Math.max(0, testRightEdge - wallRightEdge);
                                      
                                      if (overhang < minOverhang) {
                                        minOverhang = overhang;
                                        bestPosition = pos;
                                      }
                                    }
                                    newPosition = bestPosition;
                                  }
                                }
                                
                                return {
                                  ...t, 
                                  orientation: newOrientation,
                                  heightIndex: newHeightIndex,
                                  position: newPosition
                                };
                              }
                              return t;
                            }));
                          }}
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            // Högerklick för att ta bort TV
                            setTvs(prev => prev.filter(t => t.id !== tv.id));
                          }}
                        >
                          <boxGeometry args={tv.orientation === 'portrait' ? [tvConfig.height, tvConfig.width, 0.08] : [tvConfig.width, tvConfig.height, 0.08]} />
                          <meshStandardMaterial color="#222" />
                        </mesh>
                        {tvLabel && (
                          <Text
                            position={[
                              wall === 'left' ? position[0] + 0.05 : wall === 'right' ? position[0] - 0.05 : position[0], 
                              position[1], 
                              wall === 'back' ? position[2] + 0.05 : position[2]
                            ]}
                            rotation={wall === 'back' ? [0, 0, 0] : wall === 'left' ? [0, Math.PI/2, 0] : [0, -Math.PI/2, 0]}
                            fontSize={0.08}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                          >
                            {tvLabel}
                          </Text>
                        )}
                        {/* Höjd-indikator på TV */}
                        <Text
                          position={[
                            wall === 'left' ? position[0] + 0.05 : wall === 'right' ? position[0] - 0.05 : position[0], 
                            position[1] - 0.25, 
                            wall === 'back' ? position[2] + 0.05 : position[2]
                          ]}
                          rotation={wall === 'back' ? [0, 0, 0] : wall === 'left' ? [0, Math.PI/2, 0] : [0, -Math.PI/2, 0]}
                          fontSize={0.06}
                          color="#4CAF50"
                          anchorX="center"
                          anchorY="middle"
                        >
                          {heightConfig.label}
                        </Text>
                      </group>
                    );
                  })
              };

              const renderLights = (wall: 'back'|'left'|'right') => {
                if (!wallExists(wall) || !showLights) return null;
                const wallLength = wall === 'back' ? floor.width : floor.depth;
                return Array.from({length: Math.floor(wallLength)}).map((_, i) => {
                  let rotation: [number, number, number] = [0, 0, 0];
                  let position: [number, number, number];
                  
                  const lightCenter = -wallLength/2 + (i + 0.5);
                  
                  if (wall === 'back') {
                    // Inne i montern - bakre vägg (15cm in från vägg), helt ovanpå väggen
                    position = [lightCenter, wallHeight + 0.07, -(floor.depth/2) + 0.12];
                  } else if (wall === 'left') {
                    // Inne i montern - vänster vägg (15cm in från vägg), helt ovanpå väggen
                    position = [-(floor.width/2) + 0.12, wallHeight + 0.07, lightCenter];
                    rotation = [0, Math.PI/2, 0];
                  } else {
                    // Inne i montern - höger vägg (15cm in från vägg), helt ovanpå väggen
                    position = [(floor.width/2) - 0.12, wallHeight + 0.07, lightCenter];
                    rotation = [0, -Math.PI/2, 0];
                  }
                  
                  // Kontrollera om denna lampa kolliderar med något förråd
                  const hasCollisionWithStorage = storages.some(storage => {
                    const storageConfig = STORAGE_TYPES[storage.type];
                    const isRotated = storage.rotation === 90 || storage.rotation === 270;
                    const effectiveWidth = isRotated ? storageConfig.depth : storageConfig.width;
                    const effectiveDepth = isRotated ? storageConfig.width : storageConfig.depth;
                    
                    // Kontrollera om lampan är nära förrådets position
                    const storageMinX = storage.position.x - effectiveWidth/2;
                    const storageMaxX = storage.position.x + effectiveWidth/2;
                    const storageMinZ = storage.position.z - effectiveDepth/2;
                    const storageMaxZ = storage.position.z + effectiveDepth/2;
                    
                    // Utöka området med lite marginal för att undvika lampor nära förrådet
                    const margin = 0.3;
                    
                    return position[0] >= storageMinX - margin && 
                           position[0] <= storageMaxX + margin &&
                           position[2] >= storageMinZ - margin && 
                           position[2] <= storageMaxZ + margin;
                  });
                  
                  // Visa bara lampan om den inte kolliderar med förråd
                  if (hasCollisionWithStorage) return null;
                  
                  return (
                    <group key={`light-${wall}-${i}`}>
                      {/* Lampram - ljusare grå färg */}
                      <mesh position={position} rotation={rotation}>
                        <boxGeometry args={[0.06, 0.015, 0.3]} />
                        <meshStandardMaterial color="#999" />
                      </mesh>
                      
                      {/* Centrerad LED-strip - tydlig vit i mitten som i din bild */}
                      <mesh 
                        position={[
                          position[0], 
                          position[1] - 0.005, 
                          position[2]
                        ]} 
                        rotation={rotation}
                      >
                        <boxGeometry args={[0.05, 0.008, 0.25]} />
                        <meshStandardMaterial 
                          color="#ffffff" 
                          emissive="#ffffff" 
                          emissiveIntensity={1.2}
                        />
                      </mesh>
                      
                      {/* Jämn bred belysning utan ringar */}
                      <spotLight
                        position={[position[0], position[1] - 0.01, position[2]]}
                        target-position={[position[0], 0, position[2]]}
                        intensity={0.3}
                        angle={Math.PI / 2.5}
                        penumbra={0.9}
                        color="#e8f4fd"
                        distance={4}
                        decay={1}
                      />
                      
                      {/* Mjuk ambient belysning för jämn täckning */}
                      <pointLight
                        position={[position[0], position[1] - 0.4, position[2]]}
                        intensity={0.25}
                        color="#e8f4fd"
                        distance={3}
                        decay={0.3}
                      />
                      
                      {/* Extra diffust ljus för att fylla skuggor */}
                      <pointLight
                        position={[position[0], 0.5, position[2]]}
                        intensity={0.15}
                        color="#e8f4fd"
                        distance={3.5}
                        decay={0.2}
                      />
                    </group>
                  );
                });
              };

              // Hjälpfunktion för att rendera markers på en vägg, endast om väggen finns och markers är synliga och man valt en riktig TV
              const renderMarkers = (wall: 'back'|'left'|'right') => {
                if (!wallExists(wall) || !tvMarkersVisible) return null;
                let spots = wall === 'back' ? spotsBack : wall === 'left' ? spotsLeft : spotsRight;
                let wallStartX = calcWallStartX(spots);
                
                // Rendera markers för alla höjder och positioner
                return tvHeights.flatMap((heightConfig, heightIndex) => 
                  Array.from({length: spots}).map((_, positionIndex) => {
                    const isPlaced = tvs.some(tv => tv.wall === wall && tv.position === positionIndex && tv.heightIndex === heightIndex);
                    let position: [number, number, number];
                    let rotation: [number, number, number] = [0, 0, 0];
                    
                    if (wall === 'back') {
                      // Använd samma positioneringslogik som för TV:erna
                      const tvConfig = TV_SIZES[selectedTvSize];
                      const zOffset = tvConfig.label === '75" beTV' ? -(floor.depth/2) + 0.065 - 0.005 : -(floor.depth/2) + 0.065 + 0.015;
                      position = [wallStartX + positionIndex * (boxSize + gap), heightConfig.y, zOffset];
                    } else if (wall === 'left') {
                      // Använd samma positioneringslogik som för TV:erna
                      const tvConfig = TV_SIZES[selectedTvSize];
                      const xOffset = tvConfig.label === '75" beTV' ? -(floor.width/2) + 0.065 - 0.005 : -(floor.width/2) + 0.065 + 0.015;
                      position = [xOffset, heightConfig.y, wallStartX + positionIndex * (boxSize + gap)];
                      rotation = [0, Math.PI/2, 0];
                    } else {
                      // Använd samma positioneringslogik som för TV:erna
                      const tvConfig = TV_SIZES[selectedTvSize];
                      const xOffset = tvConfig.label === '75" beTV' ? (floor.width/2) - 0.065 + 0.005 : (floor.width/2) - 0.065 - 0.015;
                      position = [xOffset, heightConfig.y, wallStartX + positionIndex * (boxSize + gap)];
                      rotation = [0, -Math.PI/2, 0];
                    }
                    
                    return (
                      <group key={`${wall}-${positionIndex}-${heightIndex}`}>
                        {/* Marker-box */}
                        <mesh
                          position={position}
                          rotation={rotation}
                          onClick={() => {
                            if (isPlaced) return;
                            
                            // Smart placering - kontrollera både vertikal och horisontell kollision
                            const tvConfig = TV_SIZES[selectedTvSize];
                            const tvWidth = tvConfig.width;   // Börja i landscape
                            const tvHeight = tvConfig.height; // Börja i landscape
                            const halfTvWidth = tvWidth / 2;
                            const halfTvHeight = tvHeight / 2;
                            
                            // Vertikal kollisionskontroll
                            const topEdge = heightConfig.y + halfTvHeight;
                            const maxAllowedHeight = height - 0.1; // Lite marginal från toppen
                            
                            let finalHeightIndex = heightIndex;
                            
                            // Om TV:n skulle sticka ut vertikalt, hitta en lämplig höjd
                            if (topEdge > maxAllowedHeight) {
                              // Testa lägre positioner tills vi hittar en som fungerar
                              for (let i = tvHeights.length - 1; i >= 0; i--) {
                                const testHeight = tvHeights[i].y + halfTvHeight;
                                if (testHeight <= maxAllowedHeight) {
                                  finalHeightIndex = i;
                                  break;
                                }
                              }
                            }
                            
                            // Horisontell kollisionskontroll
                            let wallLength = 0;
                            if (wall === 'back') {
                              wallLength = floor.width;
                            } else {
                              wallLength = floor.depth;
                            }
                            
                            const tvCenterX = wallStartX + positionIndex * (boxSize + gap);
                            const leftEdge = tvCenterX - halfTvWidth;
                            const rightEdge = tvCenterX + halfTvWidth;
                            const wallLeftEdge = -wallLength / 2;
                            const wallRightEdge = wallLength / 2;
                            
                            let finalPosition = positionIndex;
                            
                            // Om TV:n sticker ut horisontellt, hitta bästa position
                            if (leftEdge < wallLeftEdge || rightEdge > wallRightEdge) {
                              let bestPosition = positionIndex;
                              let bestFit = false;
                              
                              // Testa alla positioner och hitta den som fungerar bäst
                              for (let pos = 0; pos < spots; pos++) {
                                const testCenterX = wallStartX + pos * (boxSize + gap);
                                const testLeftEdge = testCenterX - halfTvWidth;
                                const testRightEdge = testCenterX + halfTvWidth;
                                
                                if (testLeftEdge >= wallLeftEdge && testRightEdge <= wallRightEdge) {
                                  bestPosition = pos;
                                  bestFit = true;
                                  break;
                                }
                              }
                              
                              if (bestFit) {
                                finalPosition = bestPosition;
                              } else {
                                // Om ingen position fungerar, hitta den som sticker ut minst
                                let minOverhang = Infinity;
                                for (let pos = 0; pos < spots; pos++) {
                                  const testCenterX = wallStartX + pos * (boxSize + gap);
                                  const testLeftEdge = testCenterX - halfTvWidth;
                                  const testRightEdge = testCenterX + halfTvWidth;
                                  const overhang = Math.max(0, wallLeftEdge - testLeftEdge) + Math.max(0, testRightEdge - wallRightEdge);
                                  
                                  if (overhang < minOverhang) {
                                    minOverhang = overhang;
                                    bestPosition = pos;
                                  }
                                }
                                finalPosition = bestPosition;
                              }
                            }
                            
                            // Skapa TV direkt med vald storlek på rätt position och höjd
                            setTvs(prev => [...prev, {
                              id: nextTvId,
                              size: selectedTvSize,
                              wall: wall,
                              position: finalPosition,
                              heightIndex: finalHeightIndex,
                              orientation: 'landscape' as const
                            }]);
                            setNextTvId(prev => prev + 1);
                          }}
                        >
                          <boxGeometry args={[
                            boxSize * 0.8, 
                            boxSize * 0.6, 
                            TV_SIZES[selectedTvSize].label === '75" beTV' ? 0.08 : 0.02
                          ]} />
                          <meshStandardMaterial 
                            color={isPlaced ? "#ff4444" : "#4CAF50"} 
                            transparent 
                            opacity={TV_SIZES[selectedTvSize].label === '75" beTV' ? 0.9 : (isPlaced ? 0.3 : 0.7)}
                          />
                        </mesh>
                        
                        {/* Höjd-indikator */}
                        <Text
                          position={[
                            position[0],
                            position[1],
                            wall === 'back' ? position[2] + 0.02 : 
                            wall === 'left' ? position[2] : position[2]
                          ]}
                          rotation={rotation}
                          fontSize={0.08}
                          color={isPlaced ? "#ff4444" : "#4CAF50"}
                          anchorX="center"
                          anchorY="middle"
                        >
                          {heightConfig.label}
                        </Text>
                        
                        {/* Position-nummer */}
                        <Text
                          position={[
                            position[0],
                            position[1] - 0.15,
                            wall === 'back' ? position[2] + 0.02 : 
                            wall === 'left' ? position[2] : position[2]
                          ]}
                          rotation={rotation}
                          fontSize={0.06}
                          color="#666"
                          anchorX="center"
                          anchorY="middle"
                        >
                          {positionIndex + 1}
                        </Text>
                      </group>
                    );
                  })
                );
              };
              // Rendera väggar enligt vald väggform, men markers/TV på alla väggar
              let back = null, left = null, right = null;
              const wallOffset = thickness / 2; // Halva väggtjockleken
              if (wallShape === 'straight') {
                back = makeWallSections(
                  [-(floor.width/2) + wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [1, 0, 0],
                  floor.width - thickness,
                  0
                );
              } else if (wallShape === 'l') {
                back = makeWallSections(
                  [-(floor.width/2) + wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [1, 0, 0],
                  floor.width - thickness,
                  0
                );
                left = makeWallSections(
                  [-(floor.width/2) + wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [0, 0, 1],
                  floor.depth - thickness,
                  Math.PI/2
                );
              } else if (wallShape === 'u') {
                back = makeWallSections(
                  [-(floor.width/2) + wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [1, 0, 0],
                  floor.width - thickness,
                  0
                );
                left = makeWallSections(
                  [-(floor.width/2) + wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [0, 0, 1],
                  floor.depth - thickness,
                  Math.PI/2
                );
                right = makeWallSections(
                  [(floor.width/2) - wallOffset, height/2 + 0.06, -(floor.depth/2) + wallOffset],
                  [0, 0, 1],
                  floor.depth - thickness,
                  Math.PI/2
                );
              }
              return <>
                {back}
                {left}
                {right}
                
                {/* VEPA väggar med design från VepaPDFGenerator */}
                {graphic === 'vepa' && vepaWallDesigns.length > 0 && floorIndex !== null && (() => {
                  console.log('🏗️ RENDERING VEPA WALLS BLOCK, designs:', vepaWallDesigns.length);
                  const floor = FLOOR_SIZES[floorIndex];
                  const actualWidth = floor.custom ? customFloorWidth : floor.width;
                  const actualDepth = floor.custom ? customFloorDepth : floor.depth;
                  console.log('📐 Using dimensions:', actualWidth, 'x', actualDepth);
                  return (
                    <>
                      {/* Bakvägg */}
                      {vepaWallDesigns.find(d => d.wallId === 'back') && (() => {
                        const wallZ = -(actualDepth/2) + 0.09;
                        return (
                          <VepaWallOverlay
                            design={vepaWallDesigns.find(d => d.wallId === 'back')}
                            wallLength={actualWidth}
                            wallHeight={wallHeight}
                            position={[0, wallHeight/2 + 0.06, wallZ]}
                            rotation={[0, 0, 0]}
                          />
                        );
                      })()}
                      {/* Vänster vägg */}
                      {(wallShape === 'l' || wallShape === 'u') && vepaWallDesigns.find(d => d.wallId === 'left') && (
                        <VepaWallOverlay
                          design={vepaWallDesigns.find(d => d.wallId === 'left')}
                          wallLength={actualDepth}
                          wallHeight={wallHeight}
                          position={[-(actualWidth/2) + 0.09, wallHeight/2 + 0.06, 0]}
                          rotation={[0, Math.PI/2, 0]}
                        />
                      )}
                      {/* Höger vägg */}
                      {wallShape === 'u' && vepaWallDesigns.find(d => d.wallId === 'right') && (
                        <VepaWallOverlay
                          design={vepaWallDesigns.find(d => d.wallId === 'right')}
                          wallLength={actualDepth}
                          wallHeight={wallHeight}
                          position={[(actualWidth/2) - 0.09, wallHeight/2 + 0.06, 0]}
                          rotation={[0, -Math.PI/2, 0]}
                        />
                      )}
                    </>
                  );
                })()}
                
                {/* FOREX väggar med design från ForexPDFGenerator */}
                {graphic === 'forex' && forexWallDesigns.length > 0 && floorIndex !== null && (() => {
                  console.log('🏗️ RENDERING FOREX WALLS BLOCK, designs:', forexWallDesigns.length);
                  const floor = FLOOR_SIZES[floorIndex];
                  const actualWidth = floor.custom ? customFloorWidth : floor.width;
                  const actualDepth = floor.custom ? customFloorDepth : floor.depth;
                  console.log('📐 Using dimensions:', actualWidth, 'x', actualDepth);
                  return (
                    <>
                      {/* Bakvägg */}
                      {forexWallDesigns.find(d => d.wallId === 'back') && (() => {
                        const wallZ = -(actualDepth/2) + 0.09;
                        return (
                          <ForexWallOverlay
                            design={forexWallDesigns.find(d => d.wallId === 'back')}
                            wallLength={actualWidth}
                            wallHeight={wallHeight}
                            position={[0, wallHeight/2 + 0.06, wallZ]}
                            rotation={[0, 0, 0]}
                          />
                        );
                      })()}
                      {/* Vänster vägg */}
                      {(wallShape === 'l' || wallShape === 'u') && forexWallDesigns.find(d => d.wallId === 'left') && (
                        <ForexWallOverlay
                          design={forexWallDesigns.find(d => d.wallId === 'left')}
                          wallLength={actualDepth}
                          wallHeight={wallHeight}
                          position={[-(actualWidth/2) + 0.09, wallHeight/2 + 0.06, 0]}
                          rotation={[0, Math.PI/2, 0]}
                        />
                      )}
                      {/* Höger vägg */}
                      {wallShape === 'u' && forexWallDesigns.find(d => d.wallId === 'right') && (
                        <ForexWallOverlay
                          design={forexWallDesigns.find(d => d.wallId === 'right')}
                          wallLength={actualDepth}
                          wallHeight={wallHeight}
                          position={[(actualWidth/2) - 0.09, wallHeight/2 + 0.06, 0]}
                          rotation={[0, -Math.PI/2, 0]}
                        />
                      )}
                    </>
                  );
                })()}
                
                {/* Gamla bildlager för bakvägg (fallback om inte VEPA design finns) */}
                {graphic === 'vepa' && uploadedImage && vepaWallDesigns.length === 0 && floorIndex !== null && (
                  <ImageOverlay 
                    imageUrl={uploadedImage} 
                    wallLength={FLOOR_SIZES[floorIndex].width}
                    wallHeight={wallHeight}
                    position={[0, wallHeight/2 + 0.06, -(FLOOR_SIZES[floorIndex].depth/2) + 0.09]}
                    rotation={[0, 0, 0]}
                  />
                )}
                {/* Bildlager för vänster vägg - visas i L-form och U-form */}
                {graphic === 'vepa' && uploadedImageLeft && vepaWallDesigns.length === 0 && floorIndex !== null && (wallShape === 'l' || wallShape === 'u') && (
                  <ImageOverlay 
                    imageUrl={uploadedImageLeft} 
                    wallLength={FLOOR_SIZES[floorIndex].depth}
                    wallHeight={wallHeight}
                    position={[-(FLOOR_SIZES[floorIndex].width/2) + 0.09, wallHeight/2 + 0.06, 0]}
                    rotation={[0, Math.PI/2, 0]}
                  />
                )}
                {/* Bildlager för höger vägg - visas endast i U-form */}
                {graphic === 'vepa' && uploadedImageRight && vepaWallDesigns.length === 0 && floorIndex !== null && wallShape === 'u' && (
                  <ImageOverlay 
                    imageUrl={uploadedImageRight} 
                    wallLength={FLOOR_SIZES[floorIndex].depth}
                    wallHeight={wallHeight}
                    position={[(FLOOR_SIZES[floorIndex].width/2) - 0.09, wallHeight/2 + 0.06, 0]}
                    rotation={[0, -Math.PI/2, 0]}
                  />
                )}
                
                {/* GAMLA FOREX bildlager - DOLDA, använd ForexPDFGenerator istället */}
                {/* Forex bakvägg */}
                {false && graphic === 'forex' && forexImageBack && floorIndex !== null && (
                  <ForexImageOverlay 
                    imageUrl={forexImageBack!} 
                    wallLength={FLOOR_SIZES[floorIndex!].width}
                    wallHeight={wallHeight}
                    position={[0, wallHeight/2 + 0.06, -(FLOOR_SIZES[floorIndex!].depth/2) + 0.09]}
                  />
                )}
                {/* Forex vänster vägg */}
                {false && graphic === 'forex' && forexImageLeft && floorIndex !== null && (wallShape === 'l' || wallShape === 'u') && (
                  <ForexImageOverlay 
                    imageUrl={forexImageLeft!} 
                    wallLength={FLOOR_SIZES[floorIndex!].depth}
                    wallHeight={wallHeight}
                    position={[-(FLOOR_SIZES[floorIndex!].width/2) + 0.09, wallHeight/2 + 0.06, 0]}
                    rotation={[0, Math.PI/2, 0]}
                  />
                )}
                {/* Forex höger vägg */}
                {false && graphic === 'forex' && forexImageRight && floorIndex !== null && wallShape === 'u' && (
                  <ForexImageOverlay 
                    imageUrl={forexImageRight!} 
                    wallLength={FLOOR_SIZES[floorIndex!].depth}
                    wallHeight={wallHeight}
                    position={[(FLOOR_SIZES[floorIndex!].width/2) - 0.09, wallHeight/2 + 0.06, 0]}
                    rotation={[0, -Math.PI/2, 0]}
                  />
                )}
                {renderMarkers('back')}
                {renderMarkers('left')}
                {renderMarkers('right')}
                {renderTVs('back')}
                {renderTVs('left')}
                {renderTVs('right')}
                {renderLights('back')}
                {renderLights('left')}
                {renderLights('right')}
                
                {/* Truss-strukturer */}
                {selectedTrussType > 0 && (() => {
                  const trussConfig = TRUSS_TYPES[selectedTrussType];
                  // Använd rätt golvdimensioner baserat på floorIndex och customFloorWidth/customFloorDepth
                  const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
                  const currentFloorSize = {
                    width: floorConfig?.custom ? customFloorWidth : (floorConfig ? floorConfig.width : 3),
                    length: floorConfig?.custom ? customFloorDepth : (floorConfig ? floorConfig.depth : 3)
                  };
                  
                  console.log('Rendering truss:', trussConfig.type, 'floorIndex:', floorIndex, 'floorSize:', currentFloorSize);
                  
                  if (trussConfig.type === 'front-straight' && 'width' in trussConfig && 'height' in trussConfig) {
                    console.log('Rendering front-straight truss');
                    // Hängande framkant-truss - 30x30cm x golvytabredden ovanför framkanten
                    const trussHeight = wallHeight + 1.0; // Häng på vägghöjd + 1 meter
                    const wireLength = 2.0; // 2 meter vajrar upp till tak
                    
                    return (
                      <group key="truss-front-straight">
                        {/* Huvudram - 30x30cm x golvytabredden ovanför framkanten */}
                        <mesh position={[0, trussHeight, currentFloorSize.length/2]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[currentFloorSize.width, 0.3, 0.3]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        
                        {/* Vajrar upp till tak */}
                        <mesh 
                          position={[0, trussHeight + wireLength/2, currentFloorSize.length/2]} 
                          rotation={[0, 0, 0]}
                        >
                          <cylinderGeometry args={[0.005, 0.005, wireLength, 8]} />
                          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
                        </mesh>
                        
                        {/* Lampor under trussen - 3 lampor jämnt fördelade */}
                        {[
                          {x: -currentFloorSize.width/2 * 0.8, label: 'left'},
                          {x: 0, label: 'center'},
                          {x: currentFloorSize.width/2 * 0.8, label: 'right'}
                        ].map(({x, label}) => (
                          <group key={`light-${label}`}>
                            <mesh position={[x, trussHeight - 0.3 - 0.1, currentFloorSize.length/2]} rotation={[0, 0, 0]}>
                              <cylinderGeometry args={[0.08, 0.12, 0.2, 12]} />
                              <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
                            </mesh>
                            <spotLight
                              position={[x, trussHeight - 0.3 - 0.2, currentFloorSize.length/2]}
                              target-position={[x, 0, currentFloorSize.length/2 + 2]}
                              intensity={0.7}
                              angle={Math.PI / 3}
                              penumbra={0.8}
                              color="#ffffff"
                              distance={10}
                              decay={0.8}
                            />
                            <pointLight
                              position={[x, trussHeight - 0.3 - 0.2, currentFloorSize.length/2]}
                              intensity={0.3}
                              color="#ffffff"
                              distance={5}
                              decay={0.6}
                            />
                          </group>
                        ))}
                      </group>
                    );
                    
                  } else if (trussConfig.type === 'hanging-round' && 'diameter' in trussConfig && 'height' in trussConfig) {
                    console.log('Rendering hanging-round truss');
                    // Rund hängande truss i mitten av montern
                    const trussHeight = wallHeight + 1.0;
                    const wireLength = 2.0; // 2 meter vajrar upp till tak
                    
                    return (
                      <group key="truss-hanging-round">
                        {/* Huvudring */}
                        <mesh position={[0, trussHeight, 0]} rotation={[Math.PI/2, 0, 0]}>
                          <torusGeometry args={[trussConfig.diameter/2, 0.15, 8, 16]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        
                        {/* Vajrar upp till tak */}
                        {Array.from({length: 4}).map((_, i) => {
                          const angle = (i / 4) * Math.PI * 2;
                          const x = Math.cos(angle) * trussConfig.diameter/2;
                          const z = Math.sin(angle) * trussConfig.diameter/2;
                          
                          return (
                            <mesh 
                              key={`wire-${i}`}
                              position={[x, trussHeight + wireLength/2, z]} 
                              rotation={[0, 0, 0]}
                            >
                              <cylinderGeometry args={[0.005, 0.005, wireLength, 8]} />
                              <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
                            </mesh>
                          );
                        })}
                        
                        {/* Lampor på rund truss */}
                        {Array.from({length: 6}).map((_, i) => {
                          const angle = (i / 6) * Math.PI * 2;
                          const x = Math.cos(angle) * trussConfig.diameter/2 * 0.8;
                          const z = Math.sin(angle) * trussConfig.diameter/2 * 0.8;
                          
                          return (
                            <group key={`light-${i}`}>
                              <mesh position={[x, trussHeight - trussConfig.height/2 - 0.1, z]} rotation={[0, angle + Math.PI/2, 0]}>
                                <cylinderGeometry args={[0.08, 0.12, 0.2, 12]} />
                                <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
                              </mesh>
                              <spotLight
                                position={[x, trussHeight - trussConfig.height/2 - 0.2, z]}
                                target-position={[x * 0.3, 0, z * 0.3]}
                                intensity={0.7}
                                angle={Math.PI / 3}
                                penumbra={0.8}
                                color="#ffffff"
                                distance={10}
                                decay={0.8}
                              />
                              <pointLight
                                position={[x, trussHeight - trussConfig.height/2 - 0.2, z]}
                                intensity={0.3}
                                color="#ffffff"
                                distance={5}
                                decay={0.6}
                              />
                            </group>
                          );
                        })}
                      </group>
                    );
                    
                  } else if (trussConfig.type === 'hanging-square' && 'width' in trussConfig && 'depth' in trussConfig && 'height' in trussConfig) {
                    console.log('Rendering hanging-square truss');
                    // Fyrkantig hängande truss i mitten av montern - justerad storlek för att inte gå in i väggar
                    const trussHeight = wallHeight + 1.0; // Häng på vägghöjd + 1 meter
                    const wireLength = 2.0; // 2 meter vajrar upp till tak
                    const adjustedWidth = Math.max(trussConfig.width, floor.width * 0.8); // Min 80% av monterbredd för synlighet
                    const adjustedDepth = Math.max(trussConfig.depth, floor.depth * 0.8); // Min 80% av monterdjup för synlighet
                    
                    return (
                      <group key="truss-hanging-square">
                        {/* Huvudram - fyra sidor */}
                        <mesh position={[0, trussHeight, -adjustedDepth/2]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[adjustedWidth, trussConfig.height, 0.3]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        <mesh position={[0, trussHeight, adjustedDepth/2]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[adjustedWidth, trussConfig.height, 0.3]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        <mesh position={[-adjustedWidth/2, trussHeight, 0]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[0.3, trussConfig.height, adjustedDepth]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        <mesh position={[adjustedWidth/2, trussHeight, 0]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[0.3, trussConfig.height, adjustedDepth]} />
                          <meshStandardMaterial color="#666666" roughness={0.8} metalness={0.3} />
                        </mesh>
                        
                        {/* Vajrar upp till tak */}
                        {[[1,1], [1,-1], [-1,1], [-1,-1]].map(([xSign, zSign], i) => {
                          const x = xSign * adjustedWidth/2 * 0.8;
                          const z = zSign * adjustedDepth/2 * 0.8;
                          
                          return (
                            <mesh 
                              key={`wire-${i}`}
                              position={[x, trussHeight + wireLength/2, z]} 
                              rotation={[0, 0, 0]}
                            >
                              <cylinderGeometry args={[0.005, 0.005, wireLength, 8]} />
                              <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
                            </mesh>
                          );
                        })}
                        
                        {/* Lampor på fyrkantig truss */}
                        {[
                          {x: 0, z: -adjustedDepth/2 * 0.8, angle: 0},
                          {x: adjustedWidth/2 * 0.8, z: 0, angle: Math.PI/2},
                          {x: 0, z: adjustedDepth/2 * 0.8, angle: Math.PI},
                          {x: -adjustedWidth/2 * 0.8, z: 0, angle: -Math.PI/2},
                        ].map(({x, z, angle}, i) => (
                          <group key={`light-${i}`}>
                            <mesh position={[x, trussHeight - trussConfig.height/2 - 0.1, z]} rotation={[0, angle, 0]}>
                              <cylinderGeometry args={[0.08, 0.12, 0.2, 12]} />
                              <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
                            </mesh>
                            <spotLight
                              position={[x, trussHeight - trussConfig.height/2 - 0.2, z]}
                              target-position={[x * 0.3, 0, z * 0.3]}
                              intensity={0.7}
                              angle={Math.PI / 3.2}
                              penumbra={0.8}
                              color="#ffffff"
                              distance={10}
                              decay={0.8}
                            />
                            <pointLight
                              position={[x, trussHeight - trussConfig.height/2 - 0.2, z]}
                              intensity={0.3}
                              color="#ffffff"
                              distance={5}
                              decay={0.6}
                            />
                          </group>
                        ))}
                      </group>
                    );
                  } else {
                    console.log('No truss condition met for type:', trussConfig.type, 'properties:', Object.keys(trussConfig));
                  }
                  
                  return null;
                })()}
                
                {/* Diskar - visa alla placerade diskar */}
                {counters.map(counter => {
                  const counterConfig = COUNTER_TYPES.find(ct => ct.label === counter.type);
                  if (!counterConfig) return null;
                  const counterHeight = 0.9; // 90cm hög disk
                  const counterThickness = 0.05; // 5cm tjock skiva
                  
                  if (counterConfig.type === 'L') {
                    // L-formad disk: 1,5m rakt fram + 1m åt höger
                    return (
                      <group 
                        key={counter.id}
                        position={[counter.position.x, 0, counter.position.z]}
                        rotation={[0, counter.rotation * Math.PI / 180, 0]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCounters(prev => prev.map(c => 
                            c.id === counter.id 
                              ? {...c, rotation: (c.rotation + 45) % 360}
                              : c
                          ));
                        }}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          // Högerklick för att ta bort L-disk
                          setCounters(prev => prev.filter(c => c.id !== counter.id));
                        }}
                      >
                        {/* Första delen - rakt fram (1,5m x 0,5m) med hyllor på baksidan */}
                        {/* Vänster sidopanel för första delen */}
                        <mesh position={[-1, counterHeight/2, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, 0.5]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Frampanel för första delen */}
                        <mesh position={[-0.25, counterHeight/2, 0.475]} receiveShadow castShadow>
                          <boxGeometry args={[1.4, counterHeight - counterThickness, 0.05]} />
                          <meshStandardMaterial 
                            key={textureKey}
                            color={counterFrontImage ? "#ffffff" : counterPanelColor} 
                            map={counterTexture}
                            roughness={0.3} 
                            metalness={0.1}
                            transparent={!!counterFrontImage}
                          />
                        </mesh>
                        
                        {/* Vit baksida för frampanel första delen */}
                        {counterFrontImage && (
                          <mesh position={[-0.25, counterHeight/2, 0.445]} receiveShadow castShadow>
                            <boxGeometry args={[1.4, counterHeight - counterThickness, 0.05]} />
                            <meshStandardMaterial 
                              color="#ffffff"
                              roughness={0.3} 
                              metalness={0.1}
                            />
                          </mesh>
                        )}
                        
                        {/* Första hyllan för första delen */}
                        <mesh position={[-0.25, counterHeight * 0.33, 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[1.3, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Andra hyllan för första delen */}
                        <mesh position={[-0.25, counterHeight * 0.66, 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[1.3, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Botten för första delen */}
                        <mesh position={[-0.25, 0.025, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[1.5, 0.05, 0.5]} />
                          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Ekskiva för första delen */}
                        <mesh position={[-0.25, counterHeight - counterThickness/2 + 0.035, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[1.5, counterThickness, 0.5]} />
                          <meshStandardMaterial 
                            color="#C9955C" // Basek-färg
                            roughness={0.8} // Mer naturlig träyta
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur
                              const canvas = document.createElement('canvas');
                              canvas.width = 512;
                              canvas.height = 512;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 512, 512);
                              
                              // Lägg till träfibrer (horisontella linjer med variation)
                              for (let y = 0; y < 512; y += 8) {
                                const lightness = 0.8 + Math.random() * 0.4;
                                ctx.fillStyle = `rgba(255, 255, 255, ${lightness * 0.15})`;
                                ctx.fillRect(0, y + Math.random() * 4, 512, 2 + Math.random() * 3);
                              }
                              
                              // Lägg till mörkare årsringar
                              for (let i = 0; i < 8; i++) {
                                const y = Math.random() * 512;
                                ctx.fillStyle = `rgba(139, 69, 19, ${0.1 + Math.random() * 0.1})`;
                                ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(3, 1); // Sträck ut träfibrerna
                              return texture;
                            })()}
                            normalScale={new THREE.Vector2(0.3, 0.1)} // Subtil normal mapping
                          />
                        </mesh>
                        
                        {/* Andra delen - vinkel åt höger med hyllor på baksidan */}
                        {/* Höger sidopanel för andra delen */}
                        <mesh position={[0.725, counterHeight/2, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, 1]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Frampanel för andra delen */}
                        <mesh position={[0.5, counterHeight/2, 0.475]} receiveShadow castShadow>
                          <boxGeometry args={[0.4, counterHeight - counterThickness, 0.05]} />
                          <meshStandardMaterial 
                            key={textureKey}
                            color={counterFrontImage ? "#ffffff" : counterPanelColor} 
                            map={counterTexture}
                            roughness={0.3} 
                            metalness={0.1}
                            transparent={!!counterFrontImage}
                          />
                        </mesh>
                        
                        {/* Vit baksida för frampanel andra delen */}
                        {counterFrontImage && (
                          <mesh position={[0.5, counterHeight/2, 0.445]} receiveShadow castShadow>
                            <boxGeometry args={[0.4, counterHeight - counterThickness, 0.05]} />
                            <meshStandardMaterial 
                              color="#ffffff"
                              roughness={0.3} 
                              metalness={0.1}
                            />
                          </mesh>
                        )}
                        
                        {/* Första hyllan för andra delen */}
                        <mesh position={[0.5, counterHeight * 0.33, -0.35]} receiveShadow castShadow>
                          <boxGeometry args={[0.35, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Andra hyllan för andra delen */}
                        <mesh position={[0.5, counterHeight * 0.66, -0.35]} receiveShadow castShadow>
                          <boxGeometry args={[0.35, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Botten för andra delen */}
                        <mesh position={[0.5, 0.025, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.5, 0.05, 1]} />
                          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Ekskiva för andra delen */}
                        <mesh position={[0.5, counterHeight - counterThickness/2 + 0.035, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.5, counterThickness, 1]} />
                          <meshStandardMaterial 
                            color="#C9955C" // Basek-färg
                            roughness={0.8} // Mer naturlig träyta
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur (roterad för andra delen)
                              const canvas = document.createElement('canvas');
                              canvas.width = 512;
                              canvas.height = 512;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 512, 512);
                              
                              // Lägg till träfibrer (vertikala för denna del)
                              for (let x = 0; x < 512; x += 8) {
                                const lightness = 0.8 + Math.random() * 0.4;
                                ctx.fillStyle = `rgba(255, 255, 255, ${lightness * 0.15})`;
                                ctx.fillRect(x + Math.random() * 4, 0, 2 + Math.random() * 3, 512);
                              }
                              
                              // Lägg till mörkare årsringar
                              for (let i = 0; i < 8; i++) {
                                const x = Math.random() * 512;
                                ctx.fillStyle = `rgba(139, 69, 19, ${0.1 + Math.random() * 0.1})`;
                                ctx.fillRect(x, 0, 1 + Math.random() * 2, 512);
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(1, 3); // Sträck ut träfibrerna vertikalt
                              return texture;
                            })()}
                            normalScale={new THREE.Vector2(0.1, 0.3)} // Subtil normal mapping
                          />
                        </mesh>
                        
                        {/* Objekt på L-disk */}
                        {/* Espressomaskin på den långa delen */}
                        {showEspressoMachine && (
                          <EspressoMachine 
                            position={[-0.5, counterHeight + 0.05, 0.25]} 
                            rotation={0}
                          />
                        )}
                        
                        {/* Vas med blomma på kortsidan */}
                        {showFlowerVase && (
                          <FlowerVase 
                            position={[0.4, counterHeight + 0.05, -0.2]} 
                            rotation={90}
                          />
                        )}
                        
                        {/* Godiskål på hörnet */}
                        {showCandyBowl && (
                          <CandyBowl 
                            position={[0.2, counterHeight + 0.05, 0.1]} 
                            rotation={0}
                          />
                        )}
                      </group>
                    );
                  } else if (counterConfig.type === 'L-mirrored') {
                    // Spegelvänd L-formad disk: 1,5m rakt fram + 1m åt vänster
                    return (
                      <group 
                        key={counter.id}
                        position={[counter.position.x, 0, counter.position.z]}
                        rotation={[0, counter.rotation * Math.PI / 180, 0]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCounters(prev => prev.map(c => 
                            c.id === counter.id 
                              ? {...c, rotation: (c.rotation + 45) % 360}
                              : c
                          ));
                        }}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          // Högerklick för att ta bort spegelvänd L-disk
                          setCounters(prev => prev.filter(c => c.id !== counter.id));
                        }}
                      >
                        {/* Första delen - rakt fram (1,5m x 0,5m) med hyllor på baksidan */}
                        {/* Höger sidopanel för första delen */}
                        <mesh position={[1, counterHeight/2, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, 0.5]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Frampanel för första delen */}
                        <mesh position={[0.25, counterHeight/2, 0.475]} receiveShadow castShadow>
                          <boxGeometry args={[1.4, counterHeight - counterThickness, 0.05]} />
                          <meshStandardMaterial 
                            key={textureKey}
                            color={counterFrontImage ? "#ffffff" : counterPanelColor} 
                            map={counterTexture}
                            roughness={0.3} 
                            metalness={0.1}
                            transparent={!!counterFrontImage}
                          />
                        </mesh>
                        
                        {/* Vit baksida för frampanel första delen */}
                        {counterFrontImage && (
                          <mesh position={[0.25, counterHeight/2, 0.445]} receiveShadow castShadow>
                            <boxGeometry args={[1.4, counterHeight - counterThickness, 0.05]} />
                            <meshStandardMaterial 
                              color="#ffffff"
                              roughness={0.3} 
                              metalness={0.1}
                            />
                          </mesh>
                        )}
                        
                        {/* Första hyllan för första delen */}
                        <mesh position={[0.25, counterHeight * 0.33, 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[1.3, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Andra hyllan för första delen */}
                        <mesh position={[0.25, counterHeight * 0.66, 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[1.3, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Botten för första delen */}
                        <mesh position={[0.25, 0.025, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[1.5, 0.05, 0.5]} />
                          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Ekskiva för första delen */}
                        <mesh position={[0.25, counterHeight - counterThickness/2 + 0.035, 0.25]} receiveShadow castShadow>
                          <boxGeometry args={[1.5, counterThickness, 0.5]} />
                          <meshStandardMaterial 
                            color="#C9955C" // Basek-färg
                            roughness={0.8} // Mer naturlig träyta
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur
                              const canvas = document.createElement('canvas');
                              canvas.width = 512;
                              canvas.height = 512;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 512, 512);
                              
                              // Lägg till träfibrer (horisontella linjer med variation)
                              for (let y = 0; y < 512; y += 8) {
                                const lightness = 0.8 + Math.random() * 0.4;
                                ctx.fillStyle = `rgba(255, 255, 255, ${lightness * 0.15})`;
                                ctx.fillRect(0, y + Math.random() * 4, 512, 2 + Math.random() * 3);
                              }
                              
                              // Lägg till mörkare årsringar
                              for (let i = 0; i < 8; i++) {
                                const y = Math.random() * 512;
                                ctx.fillStyle = `rgba(139, 69, 19, ${0.1 + Math.random() * 0.1})`;
                                ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(3, 1); // Sträck ut träfibrerna
                              return texture;
                            })()}
                            normalScale={new THREE.Vector2(0.3, 0.1)} // Subtil normal mapping
                          />
                        </mesh>
                        
                        {/* Andra delen - vinkel åt vänster med hyllor på baksidan */}
                        {/* Vänster sidopanel för andra delen */}
                        <mesh position={[-0.725, counterHeight/2, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, 1]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Frampanel för andra delen */}
                        <mesh position={[-0.5, counterHeight/2, 0.475]} receiveShadow castShadow>
                          <boxGeometry args={[0.4, counterHeight - counterThickness, 0.05]} />
                          <meshStandardMaterial 
                            key={textureKey}
                            color={counterFrontImage ? "#ffffff" : counterPanelColor} 
                            map={counterTexture}
                            roughness={0.3} 
                            metalness={0.1}
                            transparent={!!counterFrontImage}
                          />
                        </mesh>
                        
                        {/* Vit baksida för frampanel andra delen */}
                        {counterFrontImage && (
                          <mesh position={[-0.5, counterHeight/2, 0.445]} receiveShadow castShadow>
                            <boxGeometry args={[0.4, counterHeight - counterThickness, 0.05]} />
                            <meshStandardMaterial 
                              color="#ffffff"
                              roughness={0.3} 
                              metalness={0.1}
                            />
                          </mesh>
                        )}
                        
                        {/* Första hyllan för andra delen */}
                        <mesh position={[-0.5, counterHeight * 0.33, -0.35]} receiveShadow castShadow>
                          <boxGeometry args={[0.35, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Andra hyllan för andra delen */}
                        <mesh position={[-0.5, counterHeight * 0.66, -0.35]} receiveShadow castShadow>
                          <boxGeometry args={[0.35, 0.02, 0.2]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Botten för andra delen */}
                        <mesh position={[-0.5, 0.025, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.5, 0.05, 1]} />
                          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Ekskiva för andra delen */}
                        <mesh position={[-0.5, counterHeight - counterThickness/2 + 0.035, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.5, counterThickness, 1]} />
                          <meshStandardMaterial 
                            color="#C9955C" // Basek-färg
                            roughness={0.8} // Mer naturlig träyta
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur (roterad för andra delen)
                              const canvas = document.createElement('canvas');
                              canvas.width = 512;
                              canvas.height = 512;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 512, 512);
                              
                              // Lägg till träfibrer (vertikala för denna del)
                              for (let x = 0; x < 512; x += 8) {
                                const lightness = 0.8 + Math.random() * 0.4;
                                ctx.fillStyle = `rgba(255, 255, 255, ${lightness * 0.15})`;
                                ctx.fillRect(x + Math.random() * 4, 0, 2 + Math.random() * 3, 512);
                              }
                              
                              // Lägg till mörkare årsringar
                              for (let i = 0; i < 8; i++) {
                                const x = Math.random() * 512;
                                ctx.fillStyle = `rgba(139, 69, 19, ${0.1 + Math.random() * 0.1})`;
                                ctx.fillRect(x, 0, 1 + Math.random() * 2, 512);
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(1, 3); // Sträck ut träfibrerna vertikalt
                              return texture;
                            })()}
                            normalScale={new THREE.Vector2(0.1, 0.3)} // Subtil normal mapping
                          />
                        </mesh>
                        
                        {/* Objekt på spegelvänd L-disk */}
                        {/* Espressomaskin på den långa delen */}
                        {showEspressoMachine && (
                          <EspressoMachine 
                            position={[0.5, counterHeight + 0.05, 0.25]} 
                            rotation={0}
                          />
                        )}
                        
                        {/* Vas med blomma på kortsidan */}
                        {showFlowerVase && (
                          <FlowerVase 
                            position={[-0.4, counterHeight + 0.05, -0.2]} 
                            rotation={-90}
                          />
                        )}
                        
                        {/* Godiskål på hörnet */}
                        {showCandyBowl && (
                          <CandyBowl 
                            position={[-0.2, counterHeight + 0.05, 0.1]} 
                            rotation={0}
                          />
                        )}
                      </group>
                    );
                  } else {
                    // Vanlig rak disk
                    return (
                      <group 
                        key={counter.id}
                        position={[counter.position.x, 0, counter.position.z]}
                        rotation={[0, counter.rotation * Math.PI / 180, 0]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCounters(prev => prev.map(c => 
                            c.id === counter.id 
                              ? {...c, rotation: (c.rotation + 45) % 360}
                              : c
                          ));
                        }}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          // Högerklick för att ta bort rak disk
                          setCounters(prev => prev.filter(c => c.id !== counter.id));
                        }}
                      >
                        {/* Diskstruktur med hyllor på baksidan */}
                        {/* Vänster sidopanel */}
                        <mesh position={[-counterConfig.width/2 + 0.025, counterHeight/2, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, counterConfig.depth]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Höger sidopanel */}
                        <mesh position={[counterConfig.width/2 - 0.025, counterHeight/2, 0]} receiveShadow castShadow>
                          <boxGeometry args={[0.05, counterHeight - counterThickness, counterConfig.depth]} />
                          <meshStandardMaterial color={counterPanelColor} roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Frampanel (mot besökare) */}
                        <mesh position={[0, counterHeight/2, counterConfig.depth/2 - 0.025]} receiveShadow castShadow>
                          <boxGeometry args={[counterConfig.width - 0.1, counterHeight - counterThickness, 0.05]} />
                          <meshStandardMaterial 
                            key={textureKey}
                            color={counterFrontImage ? "#ffffff" : counterPanelColor} 
                            map={counterTexture}
                            roughness={0.3} 
                            metalness={0.1}
                            transparent={!!counterFrontImage}
                          />
                        </mesh>
                        
                        {/* Vit baksida för frampanel */}
                        {counterFrontImage && (
                          <mesh position={[0, counterHeight/2, counterConfig.depth/2 - 0.055]} receiveShadow castShadow>
                            <boxGeometry args={[counterConfig.width - 0.1, counterHeight - counterThickness, 0.05]} />
                            <meshStandardMaterial 
                              color="#ffffff"
                              roughness={0.3} 
                              metalness={0.1}
                            />
                          </mesh>
                        )}
                        
                        {/* Första hyllan (1/3 höjd) */}
                        <mesh position={[0, counterHeight * 0.33, -counterConfig.depth/2 + 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[counterConfig.width - 0.15, 0.02, counterConfig.depth * 0.4]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Andra hyllan (2/3 höjd) */}
                        <mesh position={[0, counterHeight * 0.66, -counterConfig.depth/2 + 0.15]} receiveShadow castShadow>
                          <boxGeometry args={[counterConfig.width - 0.15, 0.02, counterConfig.depth * 0.4]} />
                          <meshStandardMaterial 
                            color="#C9955C" 
                            roughness={0.8} 
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur för hyllan
                              const canvas = document.createElement('canvas');
                              canvas.width = 256;
                              canvas.height = 256;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 256, 256);
                              
                              // Träfibrer längsmed hyllan
                              for (let y = 0; y < 256; y += 4) {
                                const variation = Math.sin(y * 0.02) * 10;
                                ctx.strokeStyle = `rgba(${139 + variation}, ${117 + variation}, ${85 + variation}, 0.3)`;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(256, y);
                                ctx.stroke();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(2, 1);
                              return texture;
                            })()}
                          />
                        </mesh>
                        
                        {/* Botten (för stabilitet) */}
                        <mesh position={[0, 0.025, 0]} receiveShadow castShadow>
                          <boxGeometry args={[counterConfig.width, 0.05, counterConfig.depth]} />
                          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
                        </mesh>
                        
                        {/* Ekskiva på toppen */}
                        <mesh position={[0, counterHeight - counterThickness/2 + 0.035, 0]} receiveShadow castShadow>
                          <boxGeometry args={[counterConfig.width, counterThickness, counterConfig.depth]} />
                          <meshStandardMaterial 
                            color="#C9955C" // Basek-färg
                            roughness={0.8} // Mer naturlig träyta
                            metalness={0.0}
                            roughnessMap={(() => {
                              // Skapa procedural trästruktur
                              const canvas = document.createElement('canvas');
                              canvas.width = 512;
                              canvas.height = 512;
                              const ctx = canvas.getContext('2d')!;
                              
                              // Basfärg
                              ctx.fillStyle = '#D4A574';
                              ctx.fillRect(0, 0, 512, 512);
                              
                              // Lägg till träfibrer (horisontella linjer med variation)
                              for (let y = 0; y < 512; y += 6) {
                                const lightness = 0.7 + Math.random() * 0.5;
                                const width = 1 + Math.random() * 4;
                                ctx.fillStyle = `rgba(255, 255, 255, ${lightness * 0.12})`;
                                ctx.fillRect(0, y + Math.random() * 3, 512, width);
                                
                                // Lägg till mörkare skuggor för djup
                                ctx.fillStyle = `rgba(101, 67, 33, ${0.08 + Math.random() * 0.05})`;
                                ctx.fillRect(0, y + width, 512, 1);
                              }
                              
                              // Lägg till träfläckar och kvistar
                              for (let i = 0; i < 12; i++) {
                                const x = Math.random() * 512;
                                const y = Math.random() * 512;
                                const size = 8 + Math.random() * 16;
                                ctx.fillStyle = `rgba(101, 67, 33, ${0.15 + Math.random() * 0.1})`;
                                ctx.beginPath();
                                ctx.ellipse(x, y, size, size * 0.3, 0, 0, Math.PI * 2);
                                ctx.fill();
                              }
                              
                              const texture = new THREE.CanvasTexture(canvas);
                              texture.wrapS = THREE.RepeatWrapping;
                              texture.wrapT = THREE.RepeatWrapping;
                              texture.repeat.set(counterConfig.width, counterConfig.depth); // Skala efter diskstorlek
                              return texture;
                            })()}
                            normalScale={new THREE.Vector2(0.2, 0.2)} // Balanserad normal mapping
                          />
                        </mesh>
                        
                        {/* Objekt på disken */}
                        {(counterConfig.width >= 1.5) && (
                          <>
                            {/* Längre diskar - alla objekt med bra placering */}
                            {showEspressoMachine && (
                              <EspressoMachine 
                                position={[-counterConfig.width/2 + 0.25, counterHeight + 0.05, -0.1]} 
                                rotation={0}
                              />
                            )}
                            
                            {showFlowerVase && (
                              <FlowerVase 
                                position={[counterConfig.width/2 - 0.15, counterHeight + 0.05, 0.1]} 
                                rotation={45}
                              />
                            )}
                            
                            {showCandyBowl && (
                              <CandyBowl 
                                position={[
                                  (showEspressoMachine || showFlowerVase) ? 0 : 0,
                                  counterHeight + 0.05, 
                                  (showEspressoMachine || showFlowerVase) ? 0.05 : 0
                                ]} 
                                rotation={0}
                              />
                            )}
                          </>
                        )}
                        
                        {(counterConfig.width < 1.5 && counterConfig.width >= 1) && (
                          <>
                            {/* Kortare diskar - kompakt placering av alla objekt */}
                            {showEspressoMachine && !showFlowerVase && !showCandyBowl && (
                              <EspressoMachine 
                                position={[0, counterHeight + 0.05, 0]} 
                                rotation={0}
                              />
                            )}
                            
                            {showFlowerVase && !showEspressoMachine && !showCandyBowl && (
                              <FlowerVase 
                                position={[0, counterHeight + 0.05, 0]} 
                                rotation={0}
                              />
                            )}
                            
                            {showCandyBowl && !showEspressoMachine && !showFlowerVase && (
                              <CandyBowl 
                                position={[0, counterHeight + 0.05, 0]} 
                                rotation={0}
                              />
                            )}
                            
                            {/* Två objekt - sida vid sida */}
                            {(showEspressoMachine && showFlowerVase && !showCandyBowl) && (
                              <>
                                <EspressoMachine 
                                  position={[-counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                                <FlowerVase 
                                  position={[counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                              </>
                            )}
                            
                            {(showEspressoMachine && showCandyBowl && !showFlowerVase) && (
                              <>
                                <EspressoMachine 
                                  position={[-counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                                <CandyBowl 
                                  position={[counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                              </>
                            )}
                            
                            {(showFlowerVase && showCandyBowl && !showEspressoMachine) && (
                              <>
                                <FlowerVase 
                                  position={[-counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                                <CandyBowl 
                                  position={[counterConfig.width/4, counterHeight + 0.05, 0]} 
                                  rotation={0}
                                />
                              </>
                            )}
                            
                            {/* Alla tre objekt - kompakt arrangering */}
                            {(showEspressoMachine && showFlowerVase && showCandyBowl) && (
                              <>
                                <EspressoMachine 
                                  position={[-counterConfig.width/3, counterHeight + 0.05, -0.05]} 
                                  rotation={0}
                                />
                                <FlowerVase 
                                  position={[0, counterHeight + 0.05, 0.1]} 
                                  rotation={0}
                                />
                                <CandyBowl 
                                  position={[counterConfig.width/3, counterHeight + 0.05, -0.05]} 
                                  rotation={0}
                                />
                              </>
                            )}
                          </>
                        )}
                      </group>
                    );
                  }
                })}

                {/* Förråd - visa alla placerade förråd */}
                {storages.map(storage => {
                  const storageConfig = STORAGE_TYPES[storage.type];
                  const storageHeight = wallHeight; // Samma höjd som väggarna
                  const wallThickness = 0.1; // 10cm tjocka väggar
                  
                  // Hämta designs för detta förråd
                  const storageDesignData = storageDesigns.get(storage.id);
                  const getDesignForWall = (wallType: 'back' | 'left' | 'right' | 'front') => {
                    return storageDesignData?.designs.find(d => d.wallId === wallType) || null;
                  };
                  
                  return (
                    <group 
                      key={storage.id}
                      // Lift storage so its bottom sits on top of the floor (floor top = 0.06)
                      position={[storage.position.x, 0.06, storage.position.z]}
                      rotation={[0, storage.rotation * Math.PI / 180, 0]}
                      onClick={(e) => {
                        e.stopPropagation();
                        const floor = FLOOR_SIZES[floorIndex];
                        const newRotation = (storage.rotation + 90) % 360;
                        
                        // Kontrollera om det roterade förrådet skulle gå utanför monterområdet
                        let wouldFitAfterRotation = true;
                        const isRotated = newRotation === 90 || newRotation === 270;
                        const effectiveWidth = isRotated ? storageConfig.depth : storageConfig.width;
                        const effectiveDepth = isRotated ? storageConfig.width : storageConfig.depth;
                        
                        // Kontrollera om förrådet fortfarande passar inom monterområdet efter rotation
                        const maxX = floor.width / 2;
                        const minX = -floor.width / 2;
                        const maxZ = floor.depth / 2; 
                        const minZ = -floor.depth / 2;
                        
                        if (storage.position.x + effectiveWidth/2 > maxX ||
                            storage.position.x - effectiveWidth/2 < minX ||
                            storage.position.z + effectiveDepth/2 > maxZ ||
                            storage.position.z - effectiveDepth/2 < minZ) {
                          wouldFitAfterRotation = false;
                        }
                        
                        // Bara rotera om det passar
                        if (wouldFitAfterRotation) {
                          setStorages(prev => prev.map(s => 
                            s.id === storage.id 
                              ? {...s, rotation: newRotation}
                              : s
                          ));
                        }
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        // Högerklick för att ta bort förråd
                        setStorages(prev => prev.filter(s => s.id !== storage.id));
                      }}
                    >
                      {/* Golv (relativt till grupp) - flytta ner så det ligger i botten av förrådet */}
                      <mesh position={[0, -0.03, 0]}>
                        <boxGeometry args={[storageConfig.width, 0.06, storageConfig.depth]} />
                        <meshStandardMaterial color="#ffffff" />
                      </mesh>
                      
                      {/* StorageWall komponent för varje vägg */}
                      <StorageWall
                        position={[0, storageHeight/2, -storageConfig.depth/2 + wallThickness/2]}
                        args={[storageConfig.width, storageHeight, wallThickness]}
                        color={storageColor}
                        image={storageGraphic === 'upload' ? storageUploadedImage : null}
                        wallType="back"
                        selectedWalls={storageWallSelections}
                        wallHeight={storageHeight}
                        design={getDesignForWall('back')}
                      />
                      
                      <StorageWall
                        position={[-storageConfig.width/2 + wallThickness/2, storageHeight/2, 0]}
                        args={[wallThickness, storageHeight, storageConfig.depth]}
                        color={storageColor}
                        image={storageGraphic === 'upload' ? storageUploadedImage : null}
                        wallType="left"
                        selectedWalls={storageWallSelections}
                        wallHeight={storageHeight}
                        design={getDesignForWall('left')}
                      />
                      
                      <StorageWall
                        position={[storageConfig.width/2 - wallThickness/2, storageHeight/2, 0]}
                        args={[wallThickness, storageHeight, storageConfig.depth]}
                        color={storageColor}
                        image={storageGraphic === 'upload' ? storageUploadedImage : null}
                        wallType="right"
                        selectedWalls={storageWallSelections}
                        wallHeight={storageHeight}
                        design={getDesignForWall('right')}
                      />
                      
                      <StorageWall
                        position={[0, storageHeight/2, storageConfig.depth/2 - wallThickness/2]}
                        args={[storageConfig.width, storageHeight, wallThickness]}
                        color={storageColor}
                        image={storageGraphic === 'upload' ? storageUploadedImage : null}
                        wallType="front"
                        selectedWalls={storageWallSelections}
                        wallHeight={storageHeight}
                        design={getDesignForWall('front')}
                      />
                      
                    </group>
                  );
                })}

                {/* Växter - visa alla placerade växter */}
                {plants.map(plant => {
                  const plantConfig = PLANT_TYPES[plant.type];
                  
                  return (
                    <group
                      key={plant.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlants(prev => prev.map(p => 
                          p.id === plant.id 
                            ? {...p, rotation: (p.rotation + 90) % 360}
                            : p
                        ));
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        // Högerklick för att ta bort växt
                        setPlants(prev => prev.filter(p => p.id !== plant.id));
                      }}
                    >
                      <Plant
                        plantConfig={plantConfig}
                        position={[plant.position.x, 0.065, plant.position.z]}
                        rotation={plant.rotation}
                      />
                    </group>
                  );
                })}

                {/* Möbler - visa alla placerade möbler */}
                {furniture.map(furnitureItem => {
                  const furnitureConfig = FURNITURE_TYPES[furnitureItem.type];
                  
                  return (
                    <group
                      key={furnitureItem.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Barstolar (type 'chair') roterar 45°, andra möbler 90°
                        const rotationAmount = furnitureConfig.type === 'chair' ? 45 : 90;
                        setFurniture(prev => prev.map(f => 
                          f.id === furnitureItem.id 
                            ? {...f, rotation: (f.rotation + rotationAmount) % 360}
                            : f
                        ));
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        // Högerklick för att ta bort möbel
                        setFurniture(prev => prev.filter(f => f.id !== furnitureItem.id));
                      }}
                    >
                      <Furniture
                        furnitureConfig={furnitureConfig}
                        position={[furnitureItem.position.x, 0.065, furnitureItem.position.z]}
                        rotation={furnitureItem.rotation}
                      />
                    </group>
                  );
                })}

                {/* LED-lampor på förrådsväggarnas utsidor (framsida + sida närmast mitten) */}
                {showLights && storages.map(storage => {
                  const storageConfig = STORAGE_TYPES[storage.type];
                  const isRotated = storage.rotation === 90 || storage.rotation === 270;
                  const effectiveWidth = isRotated ? storageConfig.depth : storageConfig.width;
                  const effectiveDepth = isRotated ? storageConfig.width : storageConfig.depth;
                  
                  const storageLights = [];
                  
                  // Lampor på förrådets framsida (öppning mot montern)
                  const numLightsFront = Math.floor(effectiveWidth);
                  for (let i = 0; i < numLightsFront; i++) {
                    const lightX = storage.position.x + (-effectiveWidth/2 + i + 0.5);
                    const lightZ = storage.position.z + (effectiveDepth/2 + 0.15); // Utanför förrådets framsida
                    
                    storageLights.push(
                      <group key={`storage-${storage.id}-front-${i}`}>
                        {/* Lampram */}
                        <mesh 
                          position={[lightX, wallHeight + 0.07, lightZ]}
                          rotation={[0, 0, 0]}
                        >
                          <boxGeometry args={[0.06, 0.015, 0.3]} />
                          <meshStandardMaterial color="#999" />
                        </mesh>
                        
                        {/* LED-strip */}
                        <mesh 
                          position={[lightX, wallHeight + 0.065, lightZ]}
                          rotation={[0, 0, 0]}
                        >
                          <boxGeometry args={[0.05, 0.008, 0.25]} />
                          <meshStandardMaterial 
                            color="#ffffff" 
                            emissive="#ffffff" 
                            emissiveIntensity={1.2}
                          />
                        </mesh>
                        
                        {/* Belysning riktad in mot montern */}
                        <spotLight
                          position={[lightX, wallHeight + 0.06, lightZ]}
                          target-position={[lightX, 0, lightZ - 1]}
                          intensity={0.3}
                          angle={Math.PI / 2.5}
                          penumbra={0.9}
                          color="#e8f4fd"
                          distance={4}
                          decay={1}
                        />
                        
                        <pointLight
                          position={[lightX, wallHeight - 0.4, lightZ - 0.5]}
                          intensity={0.25}
                          color="#e8f4fd"
                          distance={3}
                          decay={0.3}
                        />
                      </group>
                    );
                  }
                  
                  // Bestäm vilken sida som är närmast mitten av montern
                  const storageLeftX = storage.position.x - effectiveWidth/2;
                  const storageRightX = storage.position.x + effectiveWidth/2;
                  const centerX = 0; // Mitten av montern är vid X=0
                  
                  // Kontrollera vilket håll som är närmare mitten
                  const leftDistanceToCenter = Math.abs(storageLeftX - centerX);
                  const rightDistanceToCenter = Math.abs(storageRightX - centerX);
                  
                  // Placera lampor på den sida som är närmast mitten
                  const useLightSide = leftDistanceToCenter < rightDistanceToCenter ? 'left' : 'right';
                  
                  // Lampor på sidan närmast mitten
                  const numLightsSide = Math.floor(effectiveDepth);
                  for (let i = 0; i < numLightsSide; i++) {
                    let lightX, lightTargetX, lightPointX, rotation;
                    const lightZ = storage.position.z + (-effectiveDepth/2 + i + 0.5);
                    
                    if (useLightSide === 'left') {
                      // Vänster sida - placera utanför vänster vägg, lyser högerut
                      lightX = storage.position.x + (-effectiveWidth/2 - 0.15);
                      lightTargetX = lightX + 1;
                      lightPointX = lightX + 0.5;
                      rotation = [0, Math.PI/2, 0];
                    } else {
                      // Höger sida - placera utanför höger vägg, lyser vänsterut  
                      lightX = storage.position.x + (effectiveWidth/2 + 0.15);
                      lightTargetX = lightX - 1;
                      lightPointX = lightX - 0.5;
                      rotation = [0, -Math.PI/2, 0];
                    }
                    
                    storageLights.push(
                      <group key={`storage-${storage.id}-side-${i}`}>
                        {/* Lampram */}
                        <mesh 
                          position={[lightX, wallHeight + 0.07, lightZ]}
                          rotation={rotation as [number, number, number]}
                        >
                          <boxGeometry args={[0.06, 0.015, 0.3]} />
                          <meshStandardMaterial color="#999" />
                        </mesh>
                        
                        {/* LED-strip */}
                        <mesh 
                          position={[lightX, wallHeight + 0.065, lightZ]}
                          rotation={rotation as [number, number, number]}
                        >
                          <boxGeometry args={[0.05, 0.008, 0.25]} />
                          <meshStandardMaterial 
                            color="#ffffff" 
                            emissive="#ffffff" 
                            emissiveIntensity={1.2}
                          />
                        </mesh>
                        
                        {/* Belysning riktad mot mitten av montern */}
                        <spotLight
                          position={[lightX, wallHeight + 0.06, lightZ]}
                          target-position={[lightTargetX, 0, lightZ]}
                          intensity={0.3}
                          angle={Math.PI / 2.5}
                          penumbra={0.9}
                          color="#e8f4fd"
                          distance={4}
                          decay={1}
                        />
                        
                        <pointLight
                          position={[lightPointX, wallHeight - 0.4, lightZ]}
                          intensity={0.25}
                          color="#e8f4fd"
                          distance={3}
                          decay={0.3}
                        />
                      </group>
                    );
                  }
                  
                  return storageLights;
                })}
              </>;
              // All logik för markers och TV hanteras nu av renderMarkers/renderTVs för alla väggar
            })()}

            {/* Väggmarkörer för hyllor */}
            {shelfMarkersVisible && wallShape && wallShape !== '' && (() => {
              if (!floorIndex) {
                console.warn('❌ Cannot show shelf markers: floorIndex is null');
                return null;
              }
              
              const floor = FLOOR_SIZES[floorIndex];
              const actualWidth = floor.custom ? customFloorWidth : floor.width;
              const actualDepth = floor.custom ? customFloorDepth : floor.depth;
              
              console.log('📏 Rendering shelf markers with dimensions:', { 
                actualWidth, 
                actualDepth, 
                custom: floor.custom 
              });
              
              const wallMarkers = [];
              const markerSize = 0.5; // 4 per kvm = 0.5m avstånd
              
              // Bakvägg markörer - placera på väggen (inte framkanten)
              if (wallShape === 'straight' || wallShape === 'l' || wallShape === 'u') {
                for (let x = -actualWidth/2 + markerSize/2; x < actualWidth/2; x += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    wallMarkers.push(
                      <mesh 
                        key={`wall-marker-back-${x}-${y}`}
                        position={[x, y, -actualDepth/2 + 0.1]}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('📏 Shelf marker clicked on back wall!', { x, y });
                          // Kontrollera att hyllan (0.6m bred) inte går utanför väggen
                          const shelfWidth = 0.6;
                          const wallLeft = -actualWidth/2;
                          const wallRight = actualWidth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedX = x;
                          const shelfLeft = x - shelfWidth/2;
                          const shelfRight = x + shelfWidth/2;
                          
                          if (shelfLeft < wallLeft) {
                            // Om vänster kant går utanför, flytta hyllan så vänster kant är vid väggkanten
                            adjustedX = wallLeft + shelfWidth/2;
                          } else if (shelfRight > wallRight) {
                            // Om höger kant går utanför, flytta hyllan så höger kant är vid väggkanten
                            adjustedX = wallRight - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfLeft = adjustedX - shelfWidth/2;
                          const adjustedShelfRight = adjustedX + shelfWidth/2;
                          
                          if (adjustedShelfLeft >= wallLeft && adjustedShelfRight <= wallRight) {
                            console.log('✅ Placing shelf on back wall at:', { adjustedX, y, wall: 'back' });
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: 'back',
                              position: { x: adjustedX, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          } else {
                            console.warn('❌ Shelf would be outside wall bounds');
                          }
                        }}
                      >
                        <boxGeometry args={[0.2, 0.2, 0.03]} />
                        <meshStandardMaterial color="#00ff00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
              }
              
              // Vänster vägg markörer - placera på väggen
              if (wallShape === 'l' || wallShape === 'u') {
                for (let z = -actualDepth/2 + markerSize/2; z < actualDepth/2; z += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    wallMarkers.push(
                      <mesh 
                        key={`wall-marker-left-${z}-${y}`}
                        position={[-actualWidth/2 + 0.1, y, z]}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('📏 Shelf marker clicked on left wall!', { z, y });
                          // Kontrollera att hyllan (0.6m bred) inte går utanför väggen
                          const shelfWidth = 0.6;
                          const wallFront = -actualDepth/2;
                          const wallBack = actualDepth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedZ = z;
                          const shelfFront = z - shelfWidth/2;
                          const shelfBack = z + shelfWidth/2;
                          
                          if (shelfFront < wallFront) {
                            // Om fram kant går utanför, flytta hyllan så fram kant är vid väggkanten
                            adjustedZ = wallFront + shelfWidth/2;
                          } else if (shelfBack > wallBack) {
                            // Om bak kant går utanför, flytta hyllan så bak kant är vid väggkanten
                            adjustedZ = wallBack - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfFront = adjustedZ - shelfWidth/2;
                          const adjustedShelfBack = adjustedZ + shelfWidth/2;
                          
                          if (adjustedShelfFront >= wallFront && adjustedShelfBack <= wallBack) {
                            console.log('✅ Placing shelf on left wall at:', { adjustedZ, y, wall: 'left' });
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: 'left',
                              position: { x: adjustedZ, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          } else {
                            console.warn('❌ Shelf would be outside wall bounds');
                          }
                        }}
                      >
                        <boxGeometry args={[0.03, 0.2, 0.2]} />
                        <meshStandardMaterial color="#00ff00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
              }
              
              // Höger vägg markörer (för U-form) - placera på väggen
              if (wallShape === 'u') {
                for (let z = -actualDepth/2 + markerSize/2; z < actualDepth/2; z += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    wallMarkers.push(
                      <mesh 
                        key={`wall-marker-right-${z}-${y}`}
                        position={[actualWidth/2 - 0.1, y, z]}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('📏 Shelf marker clicked on right wall!', { z, y });
                          // Kontrollera att hyllan (0.6m bred) inte går utanför väggen
                          const shelfWidth = 0.6;
                          const wallFront = -actualDepth/2;
                          const wallBack = actualDepth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedZ = z;
                          const shelfFront = z - shelfWidth/2;
                          const shelfBack = z + shelfWidth/2;
                          
                          if (shelfFront < wallFront) {
                            // Om fram kant går utanför, flytta hyllan så fram kant är vid väggkanten
                            adjustedZ = wallFront + shelfWidth/2;
                          } else if (shelfBack > wallBack) {
                            // Om bak kant går utanför, flytta hyllan så bak kant är vid väggkanten
                            adjustedZ = wallBack - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfFront = adjustedZ - shelfWidth/2;
                          const adjustedShelfBack = adjustedZ + shelfWidth/2;
                          
                          if (adjustedShelfFront >= wallFront && adjustedShelfBack <= wallBack) {
                            console.log('✅ Placing shelf on right wall at:', { adjustedZ, y, wall: 'right' });
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: 'right',
                              position: { x: adjustedZ, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          } else {
                            console.warn('❌ Shelf would be outside wall bounds');
                          }
                        }}
                      >
                        <boxGeometry args={[0.03, 0.2, 0.2]} />
                        <meshStandardMaterial color="#00ff00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
              }
              
              // Förrådsväggar markörer - alla fyra sidor av varje förråd
              storages.forEach(storage => {
                const storageConfig = STORAGE_TYPES[storage.type];
                if (storageConfig.width === 0) return;
                
                const storageWidth = storageConfig.width;
                const storageDepth = storageConfig.depth;
                
                // Förrådets bakvägg (längst från montern)
                for (let x = -storageWidth/2 + markerSize/2; x < storageWidth/2; x += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    const worldX = storage.position.x + x * Math.cos((storage.rotation * Math.PI) / 180) - (storageDepth/2) * Math.sin((storage.rotation * Math.PI) / 180);
                    const worldZ = storage.position.z + x * Math.sin((storage.rotation * Math.PI) / 180) + (storageDepth/2) * Math.cos((storage.rotation * Math.PI) / 180);
                    
                    wallMarkers.push(
                      <mesh 
                        key={`storage-marker-back-${storage.id}-${x}-${y}`}
                        position={[worldX, y, worldZ + 0.1]}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Kontrollera att hyllan (0.6m bred) inte går utanför förrådsväggen
                          const shelfWidth = 0.6;
                          const wallLeft = -storageWidth/2;
                          const wallRight = storageWidth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedX = x;
                          const shelfLeft = x - shelfWidth/2;
                          const shelfRight = x + shelfWidth/2;
                          
                          if (shelfLeft < wallLeft) {
                            // Om vänster kant går utanför, flytta hyllan så vänster kant är vid väggkanten
                            adjustedX = wallLeft + shelfWidth/2;
                          } else if (shelfRight > wallRight) {
                            // Om höger kant går utanför, flytta hyllan så höger kant är vid väggkanten
                            adjustedX = wallRight - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfLeft = adjustedX - shelfWidth/2;
                          const adjustedShelfRight = adjustedX + shelfWidth/2;
                          
                          if (adjustedShelfLeft >= wallLeft && adjustedShelfRight <= wallRight) {
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: `storage-${storage.id}-back`,
                              position: { x: adjustedX, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          }
                        }}
                      >
                        <boxGeometry args={[0.15, 0.15, 0.03]} />
                        <meshStandardMaterial color="#ffaa00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
                
                // Förrådets vänstra vägg
                for (let z = -storageDepth/2 + markerSize/2; z < storageDepth/2; z += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    const worldX = storage.position.x + (-storageWidth/2) * Math.cos((storage.rotation * Math.PI) / 180) - z * Math.sin((storage.rotation * Math.PI) / 180);
                    const worldZ = storage.position.z + (-storageWidth/2) * Math.sin((storage.rotation * Math.PI) / 180) + z * Math.cos((storage.rotation * Math.PI) / 180);
                    
                    wallMarkers.push(
                      <mesh 
                        key={`storage-marker-left-${storage.id}-${z}-${y}`}
                        position={[worldX - 0.1, y, worldZ]}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Kontrollera att hyllan (0.6m bred) inte går utanför förrådsväggen
                          const shelfWidth = 0.6;
                          const wallFront = -storageDepth/2;
                          const wallBack = storageDepth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedZ = z;
                          const shelfFront = z - shelfWidth/2;
                          const shelfBack = z + shelfWidth/2;
                          
                          if (shelfFront < wallFront) {
                            // Om fram kant går utanför, flytta hyllan så fram kant är vid väggkanten
                            adjustedZ = wallFront + shelfWidth/2;
                          } else if (shelfBack > wallBack) {
                            // Om bak kant går utanför, flytta hyllan så bak kant är vid väggkanten
                            adjustedZ = wallBack - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfFront = adjustedZ - shelfWidth/2;
                          const adjustedShelfBack = adjustedZ + shelfWidth/2;
                          
                          if (adjustedShelfFront >= wallFront && adjustedShelfBack <= wallBack) {
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: `storage-${storage.id}-left`,
                              position: { x: adjustedZ, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          }
                        }}
                      >
                        <boxGeometry args={[0.03, 0.15, 0.15]} />
                        <meshStandardMaterial color="#ffaa00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
                
                // Förrådets högra vägg
                for (let z = -storageDepth/2 + markerSize/2; z < storageDepth/2; z += markerSize) {
                  for (let y = markerSize; y < wallHeight; y += markerSize) {
                    const worldX = storage.position.x + (storageWidth/2) * Math.cos((storage.rotation * Math.PI) / 180) - z * Math.sin((storage.rotation * Math.PI) / 180);
                    const worldZ = storage.position.z + (storageWidth/2) * Math.sin((storage.rotation * Math.PI) / 180) + z * Math.cos((storage.rotation * Math.PI) / 180);
                    
                    wallMarkers.push(
                      <mesh 
                        key={`storage-marker-right-${storage.id}-${z}-${y}`}
                        position={[worldX + 0.1, y, worldZ]}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Kontrollera att hyllan (0.6m bred) inte går utanför förrådsväggen
                          const shelfWidth = 0.6;
                          const wallFront = -storageDepth/2;
                          const wallBack = storageDepth/2;
                          
                          // Justera position så hyllan hamnar kant-i-kant med väggen
                          let adjustedZ = z;
                          const shelfFront = z - shelfWidth/2;
                          const shelfBack = z + shelfWidth/2;
                          
                          if (shelfFront < wallFront) {
                            // Om fram kant går utanför, flytta hyllan så fram kant är vid väggkanten
                            adjustedZ = wallFront + shelfWidth/2;
                          } else if (shelfBack > wallBack) {
                            // Om bak kant går utanför, flytta hyllan så bak kant är vid väggkanten
                            adjustedZ = wallBack - shelfWidth/2;
                          }
                          
                          // Kontrollera att den justerade positionen fortfarande är inom väggen
                          const adjustedShelfFront = adjustedZ - shelfWidth/2;
                          const adjustedShelfBack = adjustedZ + shelfWidth/2;
                          
                          if (adjustedShelfFront >= wallFront && adjustedShelfBack <= wallBack) {
                            setWallShelves(prev => [...prev, {
                              id: nextShelfId,
                              wall: `storage-${storage.id}-right`,
                              position: { x: adjustedZ, y }
                            }]);
                            setNextShelfId(prev => prev + 1);
                          }
                        }}
                      >
                        <boxGeometry args={[0.03, 0.15, 0.15]} />
                        <meshStandardMaterial color="#ffaa00" transparent opacity={0.8} />
                      </mesh>
                    );
                  }
                }
              });
              
              return wallMarkers;
            })()}

            {/* Placerade hyllor */}
            {wallShelves.map(shelf => {
              if (!floorIndex) {
                console.warn('❌ Cannot render shelf: floorIndex is null');
                return null;
              }
              
              const floor = FLOOR_SIZES[floorIndex];
              const actualWidth = floor.custom ? customFloorWidth : floor.width;
              const actualDepth = floor.custom ? customFloorDepth : floor.depth;
              
              let shelfPosition: [number, number, number] = [0, 0, 0];
              let shelfRotation: [number, number, number] = [0, 0, 0];
              
              if (shelf.wall === 'back') {
                shelfPosition = [shelf.position.x, shelf.position.y, -actualDepth/2];
              } else if (shelf.wall === 'left') {
                shelfPosition = [-actualWidth/2, shelf.position.y, shelf.position.x];
                shelfRotation = [0, Math.PI/2, 0];
              } else if (shelf.wall === 'right') {
                shelfPosition = [actualWidth/2, shelf.position.y, shelf.position.x];
                shelfRotation = [0, -Math.PI/2, 0];
              } else if (shelf.wall.startsWith('storage-')) {
                // Hantera förrådsväggar
                const storageId = parseInt(shelf.wall.split('-')[1]);
                const side = shelf.wall.split('-')[2];
                const storage = storages.find(s => s.id === storageId);
                
                if (storage) {
                  const storageConfig = STORAGE_TYPES[storage.type];
                  const storageWidth = storageConfig.width;
                  const storageDepth = storageConfig.depth;
                  
                  // Beräkna position baserat på förrådets position och rotation
                  const storageRad = (storage.rotation * Math.PI) / 180;
                  
                  if (side === 'back') {
                    const localX = shelf.position.x;
                    shelfPosition = [
                      storage.position.x + localX * Math.cos(storageRad) - (storageDepth/2) * Math.sin(storageRad),
                      shelf.position.y,
                      storage.position.z + localX * Math.sin(storageRad) + (storageDepth/2) * Math.cos(storageRad)
                    ];
                    shelfRotation = [0, storage.rotation * Math.PI / 180, 0];
                  } else if (side === 'left') {
                    const localZ = shelf.position.x;
                    shelfPosition = [
                      storage.position.x + (-storageWidth/2) * Math.cos(storageRad) - localZ * Math.sin(storageRad),
                      shelf.position.y,
                      storage.position.z + (-storageWidth/2) * Math.sin(storageRad) + localZ * Math.cos(storageRad)
                    ];
                    shelfRotation = [0, (storage.rotation + 90) * Math.PI / 180, 0];
                  } else if (side === 'right') {
                    const localZ = shelf.position.x;
                    shelfPosition = [
                      storage.position.x + (storageWidth/2) * Math.cos(storageRad) - localZ * Math.sin(storageRad),
                      shelf.position.y,
                      storage.position.z + (storageWidth/2) * Math.sin(storageRad) + localZ * Math.cos(storageRad)
                    ];
                    shelfRotation = [0, (storage.rotation - 90) * Math.PI / 180, 0];
                  }
                } else {
                  // Fallback om förrådsobjektet inte hittas
                  shelfPosition = [shelf.position.x, shelf.position.y, 0];
                }
              } else {
                // Fallback för okända väggar
                shelfPosition = [shelf.position.x, shelf.position.y, 0];
              }
              
              return (
                <group
                  key={shelf.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Högerklick för att ta bort hylla
                    setWallShelves(prev => prev.filter(s => s.id !== shelf.id));
                  }}
                >
                  <WallShelf
                    position={shelfPosition}
                    rotation={shelfRotation}
                    width={0.6}
                  />
                </group>
              );
            })}

            {/* Golvmarkörer för högtalare */}
            {speakerMarkersVisible && (() => {
              if (!floorIndex) {
                console.warn('❌ Cannot show speaker markers: floorIndex is null');
                return null;
              }
              
              const floor = FLOOR_SIZES[floorIndex];
              const actualWidth = floor.custom ? customFloorWidth : floor.width;
              const actualDepth = floor.custom ? customFloorDepth : floor.depth;
              
              console.log('🔊 Rendering speaker markers with dimensions:', { 
                actualWidth, 
                actualDepth, 
                custom: floor.custom 
              });
              
              const floorMarkers = [];
              const markerSize = 0.5; // 4 per kvadratmeter = 0.5m avstånd
              
              for (let x = -actualWidth/2 + markerSize/2; x < actualWidth/2; x += markerSize) {
                for (let z = -actualDepth/2 + markerSize/2; z < actualDepth/2; z += markerSize) {
                  // Undvik områden där det finns diskar eller förråd
                  const tooCloseToCounter = counters.some(counter => {
                    const counterConfig = COUNTER_TYPES.find(ct => ct.label === counter.type);
                    if (!counterConfig || counterConfig.width === 0) return false;
                    const dx = Math.abs(x - counter.position.x);
                    const dz = Math.abs(z - counter.position.z);
                    return dx < 1.0 && dz < 1.0;
                  });
                  
                  const tooCloseToStorage = storages.some(storage => {
                    const storageConfig = STORAGE_TYPES[storage.type];
                    if (storageConfig.width === 0) return false;
                    const dx = Math.abs(x - storage.position.x);
                    const dz = Math.abs(z - storage.position.z);
                    return dx < 1.0 && dz < 1.0;
                  });
                  
                  // Kontrollera om det redan finns en högtalare här
                  const speakerExists = speakers.some(speaker => {
                    const dx = Math.abs(x - speaker.position.x);
                    const dz = Math.abs(z - speaker.position.z);
                    return dx < 0.3 && dz < 0.3;
                  });
                  
                  if (!tooCloseToCounter && !tooCloseToStorage && !speakerExists) {
                    floorMarkers.push(
                      <mesh 
                        key={`speaker-marker-${x}-${z}`}
                        position={[x, 0.06, z]}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔊 Speaker marker clicked! Placing at:', { x, z });
                          setSpeakers(prev => [...prev, {
                            id: nextSpeakerId,
                            position: { x, z },
                            rotation: 0
                          }]);
                          setNextSpeakerId(prev => prev + 1);
                        }}
                        onPointerOver={() => {
                          document.body.style.cursor = 'pointer';
                        }}
                        onPointerOut={() => {
                          document.body.style.cursor = 'default';
                        }}
                      >
                        <boxGeometry args={[0.15, 0.03, 0.15]} />
                        <meshStandardMaterial 
                          color="#4444ff" 
                          transparent 
                          opacity={0.8}
                          emissive="#2222bb"
                          emissiveIntensity={0.2}
                        />
                      </mesh>
                    );
                  }
                }
              }
              
              return floorMarkers;
            })()}

            {/* Placerade högtalare */}
            {speakers.map(speaker => (
              <group
                key={speaker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  // Rotera högtalare vid klick
                  setSpeakers(prev => prev.map(s => 
                    s.id === speaker.id 
                      ? {...s, rotation: (s.rotation + 45) % 360}
                      : s
                  ));
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  // Högerklick för att ta bort högtalare
                  setSpeakers(prev => prev.filter(s => s.id !== speaker.id));
                }}
                onPointerOver={() => {
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'default';
                }}
              >
                <SpeakerOnStand
                  position={[speaker.position.x, 0, speaker.position.z]}
                  rotation={[0, (speaker.rotation * Math.PI) / 180, 0]}
                  size={speakerSize}
                />
              </group>
            ))}

            {/* Klädhängare i förråd */}
            {showClothingRacks && storages.map(storage => {
              const storageConfig = STORAGE_TYPES[storage.type];
              if (storageConfig.width === 0) return null;
              
              // Placera klädhängare i mitten av förrådet
              return (
                <ClothingRack 
                  key={`clothing-rack-${storage.id}`}
                  position={[storage.position.x, 0, storage.position.z]} 
                  rotation={[0, (storage.rotation * Math.PI) / 180, 0]}
                  height={1.6}
                />
              );
            })}
            
            {/* Komponent för att exportera aktuell scen - DISABLED för att undvika TypeScript-fel */}
            {/* <SceneExporter orderData={{...}} /> */}
            
            <OrbitControls />
          </Canvas>
            </ErrorBoundary>
          );
        })()}
      </div>

      {/* Monterhyra vattenstämpel - flera lager */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          pointerEvents: 'none',
          opacity: 0.15
        }}>
          <img 
            src="/Loggo/Monterhyra Logotyp.png" 
            alt="Monterhyra" 
            style={{
              width: '150px',
              height: 'auto',
              filter: 'grayscale(100%)'
            }}
          />
        </div>
        
        {/* Extra vattenstämplar - svårare att redigera bort */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1000,
          pointerEvents: 'none',
          opacity: 0.08,
          transform: 'rotate(-45deg)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
          }}>
            MONTERHYRA.SE - ENDAST FÖR FÖRHANDSGRANSKNING
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          zIndex: 1000,
          pointerEvents: 'none',
          opacity: 0.05
        }}>
          <div style={{
            fontSize: '48px',
            color: '#999',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
            userSelect: 'none'
          }}>
            MONTERHYRA
          </div>
        </div>
      </div>

      {/* 📝 REGISTRERINGS-MODAL - Visas efter 1 minut */}
      {showRegistrationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <img 
                src="/Loggo/Monterhyra Logotyp.png" 
                alt="Monterhyra" 
                style={{ height: '60px', marginBottom: '20px' }}
              />
              <h2 style={{ 
                margin: 0, 
                color: '#333',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Fortsätt designa din monter
              </h2>
              <p style={{ 
                color: '#666', 
                margin: '10px 0 0 0',
                fontSize: '16px'
              }}>
                För att fortsätta och få din personliga offert behöver vi dina företagsuppgifter
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // Validera formuläret
              if (!registrationData.name || !registrationData.company || !registrationData.email) {
                alert('Vänligen fyll i alla obligatoriska fält (markerade med *)');
                return;
              }
              
              // Enkel email-validering
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(registrationData.email)) {
                alert('Vänligen ange en giltig e-postadress');
                return;
              }

              // Spara registreringsdata och stäng modal
              setIsRegistered(true);
              setShowRegistrationModal(false);
              
              // Här kan du skicka data till server senare
              console.log('Registrering sparad:', registrationData);
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0',
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600',
                    borderBottom: '2px solid #e1e5e9',
                    paddingBottom: '8px'
                  }}>
                    👤 Kontaktperson
                  </h3>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Namn *
                  </label>
                  <input
                    type="text"
                    value={registrationData.name}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      name: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    E-post *
                  </label>
                  <input
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      email: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Företag *
                  </label>
                  <input
                    type="text"
                    value={registrationData.company}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      company: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={registrationData.phone}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      phone: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ 
                    margin: '20px 0 15px 0',
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600',
                    borderBottom: '2px solid #e1e5e9',
                    paddingBottom: '8px'
                  }}>
                    🏢 Företagsinformation
                  </h3>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Organisationsnummer
                  </label>
                  <input
                    type="text"
                    value={registrationData.orgNumber}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      orgNumber: e.target.value
                    })}
                    placeholder="123456-7890"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ 
                    margin: '20px 0 15px 0',
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600',
                    borderBottom: '2px solid #e1e5e9',
                    paddingBottom: '8px'
                  }}>
                    📍 Mäss- & Eventinformation
                  </h3>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Mässa/Event
                  </label>
                  <input
                    type="text"
                    value={registrationData.eventName}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      eventName: e.target.value
                    })}
                    placeholder="t.ex. Elmia, Stockholmsmässan..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Stad
                  </label>
                  <input
                    type="text"
                    value={registrationData.eventCity}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      eventCity: e.target.value
                    })}
                    placeholder="t.ex. Stockholm, Göteborg..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Byggdatum
                  </label>
                  <input
                    type="date"
                    value={registrationData.buildDate}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      buildDate: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Rivdatum
                  </label>
                  <input
                    type="date"
                    value={registrationData.teardownDate}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      teardownDate: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #e1e5e9'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  maxWidth: '60%'
                }}>
                  <p style={{ margin: 0 }}>
                    ✅ Dina uppgifter används endast för att skapa din personliga offert<br/>
                    🔒 Vi delar aldrig dina uppgifter med tredje part
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      // Bara stäng modal utan att registrera
                      setShowRegistrationModal(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    Fortsätt designa →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Utvecklarverktyg upplåst-indikator */}
      {devToolsUnlocked && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(40, 167, 69, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔓 UTVECKLARLÄGE AKTIVT (MacOS)
          <button
            onClick={() => setDevToolsUnlocked(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              opacity: 0.8
            }}
            title="Lås igen utvecklarverktyg"
          >
            🔒
          </button>
        </div>
      )}

      {/* Hemlig utvecklar-upplåsningsknapp (osynlig igen) */}
      {!devToolsUnlocked && (
        <div 
          onClick={(e) => {
            e.preventDefault();
            console.log('🔑 Secret unlock button clicked!');
            const userCode = prompt('🔑 Utvecklarkod:');
            if (userCode === 'MONTER2025') {
              setDevToolsUnlocked(true);
              alert('✅ Utvecklarverktyg upplåsta! Nu kan du använda Cmd+Option+I, högerklick, etc.');
            } else if (userCode !== null) {
              alert('❌ Fel kod. Försök igen.');
            }
          }}
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            width: '10px',
            height: '10px',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 9999
          }}
          title="🔓"
        />
      )}

      {/* VEPA PDF Generator Popup */}
      {showVepaPDFGenerator && (() => {
        const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
        const wallWidth = floorConfig?.custom ? customFloorWidth : (floorConfig?.width || 3);
        const wallDepth = floorConfig?.custom ? customFloorDepth : (floorConfig?.depth || 1.5);
        
        return (
          <VepaPDFGenerator
            wallShape={wallShape}
            wallWidth={wallWidth}
            wallDepth={wallDepth}
            wallHeight={wallHeight}
            existingDesigns={vepaWallDesigns.length > 0 ? vepaWallDesigns : undefined}
            onClose={() => setShowVepaPDFGenerator(false)}
            onApplyDesigns={(designs) => {
              setVepaWallDesigns(designs);
              console.log('📐 VEPA designs applicerade:', designs);
            }}
          />
        );
      })()}

      {/* Forex PDF Generator Popup */}
      {showForexPDFGenerator && (() => {
        const floorConfig = floorIndex !== null ? FLOOR_SIZES[floorIndex] : null;
        const wallWidth = floorConfig?.custom ? customFloorWidth : (floorConfig?.width || 3);
        const wallDepth = floorConfig?.custom ? customFloorDepth : (floorConfig?.depth || 1.5);
        
        return (
          <ForexPDFGenerator
            wallShape={wallShape as 'straight' | 'l' | 'u'}
            wallWidth={wallWidth}
            wallDepth={wallDepth}
            wallHeight={wallHeight}
            existingDesigns={forexWallDesigns.length > 0 ? forexWallDesigns : undefined}
            onClose={() => setShowForexPDFGenerator(false)}
            onApplyDesigns={(designs) => {
              setForexWallDesigns(designs);
              console.log('🖼️ Forex designs applicerade:', designs);
            }}
          />
        );
      })()}

      {/* Storage PDF Generator */}
      {showStoragePDFGenerator && selectedStorageForDesign !== null && (() => {
        const storage = storages.find(s => s.id === selectedStorageForDesign);
        if (!storage) return null;
        
        const storageConfig = STORAGE_TYPES[storage.type];
        const freeWalls = calculateFreeStorageWalls(storage);
        const existingDesign = storageDesigns.get(storage.id);
        
        return (
          <StoragePDFGenerator
            storageWidth={storageConfig.width}
            storageDepth={storageConfig.depth}
            storageHeight={wallHeight}
            freeWalls={freeWalls}
            existingDesigns={existingDesign?.designs}
            existingPrintType={existingDesign?.printType}
            onClose={() => {
              setShowStoragePDFGenerator(false);
              setSelectedStorageForDesign(null);
            }}
            onApplyDesigns={(designs, printType) => {
              setStorageDesigns(prev => {
                const newMap = new Map(prev);
                newMap.set(storage.id, { designs, printType });
                return newMap;
              });
              console.log('🖼️ Storage designs applicerade för förråd #' + storage.id + ':', designs);
            }}
          />
        );
      })()}

      {/* Counter PDF Generator */}
      {showCounterPDFGenerator && counters.length > 0 && (
        <CounterPDFGenerator
          counters={counters}
          existingDesigns={counterDesigns?.designs}
          existingPrintType={counterDesigns?.printType}
          onClose={() => {
            setShowCounterPDFGenerator(false);
          }}
          onApplyDesigns={(designs, printType) => {
            setCounterDesigns({ designs, printType });
            console.log('🖼️ Counter designs applicerade:', designs);
          }}
        />
      )}

      {/* Exhibitor Login / Dashboard */}
      {loggedInExhibitor === null && window.location.pathname.startsWith('/exhibitor') && (
        <ExhibitorLogin 
          token={window.location.pathname.split('/')[2]}
          onLogin={(exhibitor) => setLoggedInExhibitor(exhibitor)}
        />
      )}
      {loggedInExhibitor && (
        <ExhibitorDashboard 
          exhibitor={loggedInExhibitor}
          onLogout={() => setLoggedInExhibitor(null)}
        />
      )}

      {/* Admin Portal */}
      {showAdminPortal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: 'white',
          overflowY: 'auto', // allow scrolling when AdminPortal content is taller than viewport
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}>
          <AdminPortal />
          <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 10001,
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                // Handle logout - this would need to be passed from AdminPortal or handled differently
                // For now, we'll just close the admin portal
                setShowAdminPortal(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Logga ut
            </button>
            <button
              onClick={() => setShowAdminPortal(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕ Stäng Admin
            </button>
          </div>
        </div>
      )}

      {/* Admin-knapp längst ner */}
      <button
        onClick={() => setShowAdminPortal(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 24px',
          backgroundColor: '#2c3e50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        title="Öppna admin-portal för beställningar"
      >
        🔐 Admin
      </button>

    </div>
  );
}


