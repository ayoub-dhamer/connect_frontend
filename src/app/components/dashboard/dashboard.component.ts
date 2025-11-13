import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

Chart.register(...registerables);

export interface User {
  id: number;
  name: string;
  role: string;
  city: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // KPI cards
  stats = [
    { label: 'Total Users', value: '1,234', color: 'bg-primary' },
    { label: 'Revenue', value: '$56,789', color: 'bg-success' },
    { label: 'Orders', value: '872', color: 'bg-warning' },
    { label: 'Growth', value: '24%', color: 'bg-info' }
  ];

  // Users Table
  displayedColumns: string[] = ['id', 'name', 'role', 'city', 'status'];
  dataSource = new MatTableDataSource<User>([
    { id: 1, name: 'Alice Johnson', role: 'Admin', city: 'New York', status: 'Active' },
    { id: 2, name: 'Bob Williams', role: 'Manager', city: 'Paris', status: 'Inactive' },
    { id: 3, name: 'Charlie Brown', role: 'Developer', city: 'London', status: 'Active' },
    { id: 4, name: 'Diana Prince', role: 'Designer', city: 'Berlin', status: 'Active' },
    { id: 5, name: 'Ethan Hunt', role: 'Agent', city: 'Rome', status: 'Inactive' },
    { id: 6, name: 'Fiona Shaw', role: 'HR', city: 'Toronto', status: 'Active' },
    { id: 7, name: 'George Miller', role: 'Intern', city: 'Madrid', status: 'Pending' },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.initCharts();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  initCharts() {
    // Sales Chart
    new Chart('salesChart', {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Sales ($)',
          data: [12000, 15000, 10000, 18000, 22000, 19000],
          borderColor: '#007bff',
          fill: true,
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.3
        }]
      }
    });

    // Revenue Chart
    new Chart('revenueChart', {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Revenue ($)',
          data: [2000, 2300, 1800, 2700, 3000, 2500, 3100],
          backgroundColor: 'rgba(40, 167, 69, 0.6)'
        }]
      }
    });

    // Pie Chart
    new Chart('userTypeChart', {
      type: 'doughnut',
      data: {
        labels: ['Admin', 'Manager', 'Staff'],
        datasets: [{
          data: [5, 10, 20],
          backgroundColor: ['#007bff', '#ffc107', '#28a745']
        }]
      }
    });
  }
}
