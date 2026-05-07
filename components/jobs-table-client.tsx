'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobsTable } from '@/components/jobs-table';
import type { Job } from '@/lib/types';

interface JobsTableClientProps {
  jobs?: Job[];
}

export function JobsTableClient({ jobs: initialJobs = [] }: JobsTableClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch jobs from API
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (error) {
        console.error('[v0] Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading && jobs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>;
  }

  return (
    <JobsTable
      jobs={jobs}
      onJobClick={(id) => router.push(`/jobs/${id}`)}
    />
  );
}
