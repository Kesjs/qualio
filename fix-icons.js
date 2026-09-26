const fs = require('fs');
let content, filepath;

// 1. src/app/dashboard/sites/page.tsx
filepath = 'src/app/dashboard/sites/page.tsx';
content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/import \{[\s\S]*?\} from '@heroicons\/react\/24\/outline'/, \import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  SignalIcon as Radar,
  ArrowUpRightIcon as ArrowUpRight,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'\);
content = content.replace(/<Loader2/g, '<ArrowPathIcon');
content = content.replace(/<Play/g, '<PlayIcon');
content = content.replace(/<ChevronDown/g, '<ChevronDownIcon');
fs.writeFileSync(filepath, content, 'utf8');

// 2. src/components/dashboard/AddSiteModal.tsx
filepath = 'src/components/dashboard/AddSiteModal.tsx';
content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/import \{[\s\S]*?\} from '@heroicons\/react\/24\/outline'/, \import { XMarkIcon, GlobeAltIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'\);
fs.writeFileSync(filepath, content, 'utf8');

// 3. src/components/dashboard/EvidenceDrawer.tsx
filepath = 'src/components/dashboard/EvidenceDrawer.tsx';
content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/import \{[\s\S]*?\} from '@heroicons\/react\/24\/outline'/, \import {
  XMarkIcon,
  ClipboardDocumentIcon as Copy,
  CheckIcon as Check,
  CameraIcon,
  GlobeAltIcon,
  CommandLineIcon,
  ArrowsPointingOutIcon as Maximize2,
  ArrowsPointingInIcon as Minimize2,
  CodeBracketIcon as FileCode,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'\);
fs.writeFileSync(filepath, content, 'utf8');

// 4. src/components/dashboard/RunScanModal.tsx
filepath = 'src/components/dashboard/RunScanModal.tsx';
content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/import \{[\s\S]*?\} from '@heroicons\/react\/24\/outline'/, \import {
  XMarkIcon,
  PlayIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'\);
content = content.replace(/<AlertCircle/g, '<ExclamationCircleIcon');
content = content.replace(/<CheckSquare/g, '<CheckCircleIcon');
fs.writeFileSync(filepath, content, 'utf8');

console.log('Fixed imports!');
