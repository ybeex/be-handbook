import {
  Server, ArrowLeftRight, Globe, MapPin, Network, Plug, FileJson, GitMerge, Zap, Radio,
  ShieldCheck, Cookie, KeyRound, Key, Globe2, ShieldAlert, Hash,
  Hexagon, RefreshCw, Timer, Waves, Cpu, MemoryStick,
  Database, Table, Boxes, DatabaseZap, FlaskConical, Search, Copy, Triangle,
  Building2, Box, Grid3x3, Waypoints, Scissors, Target,
  TrendingUp, Scale, List, Gauge,
  Rocket, Container, Workflow, GitBranch, Activity,
  LayoutDashboard, Link, MessageSquare, Bell, CreditCard,
  Layers, LucideProps, CircleDot, Code2, BookOpen, PlayCircle,
  ChevronRight, ChevronDown, ChevronLeft, Check, X, Info, AlertTriangle,
  Terminal, Settings, HelpCircle, BarChart2, Fingerprint, Lock,
} from 'lucide-react';
import type { FC } from 'react';

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Server, ArrowLeftRight, Globe, MapPin, Network, Plug, FileJson, GitMerge, Zap, Radio,
  ShieldCheck, Cookie, KeyRound, Key, Globe2, ShieldAlert, Hash,
  Hexagon, RefreshCw, Timer, Waves, Cpu, MemoryStick,
  Database, Table, Boxes, DatabaseZap, FlaskConical, Search, Copy, Triangle,
  Building2, Box, Grid3x3, Waypoints, Scissors, Target,
  TrendingUp, Scale, List, Gauge,
  Rocket, Container, Workflow, GitBranch, Activity,
  LayoutDashboard, Link, MessageSquare, Bell, CreditCard,
  Layers, CircleDot, Code2, BookOpen, PlayCircle,
  ChevronRight, ChevronDown, ChevronLeft, Check, X, Info, AlertTriangle,
  Terminal, Settings, HelpCircle, BarChart2, Fingerprint, Lock,
};

interface IconProps extends LucideProps {
  name: string;
}

export default function Icon({ name, ...props }: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) return <CircleDot {...props} />;
  return <Component {...props} />;
}
