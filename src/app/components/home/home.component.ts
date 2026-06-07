import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  features = [
    {
      icon: '📋',
      title: 'Project Management',
      desc: 'Create projects, assign tasks, set deadlines, and track progress with visual boards and timelines.',
    },
    {
      icon: '💬',
      title: 'Real-Time Messaging',
      desc: 'Chat privately or in channels, share files instantly, and keep every conversation in context.',
    },
    {
      icon: '🎥',
      title: 'Video Calls',
      desc: 'Start instant video meetings from any project or chat thread — no third-party app needed.',
    },
  ];

  freePlanFeatures = [
    { label: 'Up to 3 projects', included: true },
    { label: 'Up to 10 tasks', included: true },
    { label: 'Basic chat', included: true },
    { label: 'Video calls', included: false },
    { label: 'Priority support', included: false },
  ];

  proPlanFeatures = [
    { label: 'Unlimited projects', included: true },
    { label: 'Unlimited tasks', included: true },
    { label: 'Real-time chat', included: true },
    { label: 'Video calls', included: true },
    { label: 'Priority support', included: true },
  ];

  constructor(public router: Router) {}

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
