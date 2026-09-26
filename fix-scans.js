const fs = require('fs');
const filepath = 'src/app/dashboard/scans/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Replace lucide imports
content = content.replace(/import \{[\s\S]*?\} from 'lucide-react'/, \import { 
  MagnifyingGlassIcon as Search, 
  FunnelIcon as Filter, 
  ArrowTopRightOnSquareIcon as ArrowUpRight, 
  CheckCircleIcon as CheckCircle2,
  ClockIcon as Clock,
  ExclamationTriangleIcon as AlertTriangle
} from '@heroicons/react/24/outline'\);

// Add useScans import
content = content.replace(/import \{ useState \} from 'react'/, \import { useState, useMemo } from 'react'
import { useScans } from '@/lib/hooks/useScan'
import Link from 'next/link'\);

// Replace allScans with useScans hook inside the component
content = content.replace(/const allScans = \[[\\s\\S]*?\]/, '');

// Inside the component
content = content.replace(/const \[search, setSearch\] = useState\(''\)/, \const [search, setSearch] = useState('')
  const { data: scans, isLoading } = useScans()

  const filteredScans = useMemo(() => {
    if (!scans) return []
    return scans.filter(scan => {
      const searchLower = search.toLowerCase()
      return (
        scan.id.toLowerCase().includes(searchLower) ||
        (scan.site?.url || '').toLowerCase().includes(searchLower)
      )
    })
  }, [scans, search])\);

// Replace allScans.map with filteredScans.map
content = content.replace(/allScans\.map\(\(scan\) => \(/, 'filteredScans.map((scan) => (');

// Fix the mapping variables
content = content.replace(/\{scan\.id\}/g, '{scan.id.slice(0, 8)}');
content = content.replace(/\{scan\.site\}/g, '{scan.site?.name || scan.site?.url?.replace(/^https?:\\\\/\\\\//, "")}');
content = content.replace(/\{scan\.trigger\}/g, "{'Manuel'}");
content = content.replace(/\{scan\.date\}/g, '{new Date(scan.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}');
content = content.replace(/\{scan\.checksPassed\}/g, '{scan.checks_total ? scan.checks_total - (scan.checks_failed || 0) : 0}');
content = content.replace(/\{scan\.checksFailed\}/g, '{scan.checks_failed || 0}');
content = content.replace(/\{scan\.duration\}/g, '{scan.started_at && scan.completed_at ? Math.round((new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000) + "s" : "-"}');

// Fix status
content = content.replace(/scan\.status === 'Succès'/g, "scan.status === 'completed'");
content = content.replace(/\{scan\.status\}/g, "{scan.status === 'completed' ? 'Succès' : scan.status === 'failed' ? 'Échec' : scan.status}");

// Replace action button with a Link
content = content.replace(/<button[\\s\\S]*?<span>Détails<\/span>[\\s\\S]*?<ArrowUpRight className="h-3 w-3" \/>[\\s\\S]*?<\/button>/, \<Link
                      href={\/dashboard/sites/\\}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:text-[#d95514] dark:text-[#ff7836] dark:hover:text-[#ee6018]"
                    >
                      <span>Détails</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>\);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed scans page.');
