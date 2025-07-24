import { DATA } from "@/data/resume";

interface GitHubStatsProps {
  username?: string;
}

export function GitHubStats({ username }: GitHubStatsProps) {
  // Extract username from GitHub URL if not provided directly
  const githubUsername = username || DATA.contact.social.GitHub.url.split('/').pop() || 'github';

  return (
    <div className="space-y-4">
      {/* GitHub Contribution Graph - larger and scrollable */}
      <div className="bg-card p-4">
        <div className="space-y-4">
          {/* Scrollable GitHub Contribution Graph */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px] flex justify-center">
              <img
                src={`https://ghchart.rshah.org/${githubUsername}`}
                alt="GitHub Contribution Graph"
                className="w-full max-w-none"
                style={{ minWidth: '800px', height: 'auto' }}
                loading="lazy"
              />
            </div>
          </div>
          
          {/* Contribution count */}
          <div className="text-left">
            <span className="text-sm text-muted-foreground">
              Check out my contributions on{" "}
              <a 
                href={DATA.contact.social.GitHub.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 