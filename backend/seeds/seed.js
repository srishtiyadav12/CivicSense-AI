/**
 * Database seeding script for CivicSense AI (MySQL + Sequelize)
 * Run: npm run seed       (creates sample data)
 *      npm run seed:reset (drops/recreates tables and re-seeds)
 *
 * Includes demo data for BOTH the analytics/heatmap views AND the automatic
 * complaint-clustering feature: several nearby, similar complaints are grouped
 * into clusters (root + members sharing a clusterId), mirroring what the
 * runtime clustering service produces.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/db');
const { User, Department, Complaint, ActivityLog, syncAll } = require('../src/models');
const { DEPARTMENTS, COMPLAINT_STATUS } = require('../src/config/constants');

const reset = process.argv.includes('--reset');

const seedData = async () => {
  try {
    if (reset) {
      console.log('Dropping and recreating tables...');
      // Temporarily disable FK checks so tables can be dropped in any order
      // (otherwise MySQL refuses to drop a parent table like `users` that
      // `departments` references via a FK).
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      await sequelize.drop({ cascade: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    }

    // Create tables
    await syncAll();
    console.log('Database schema synced');

    console.log('Seeding users...');

    // Admin
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@civicsense.ai' },
      defaults: { name: 'System Administrator', password: 'admin123', role: 'admin', isActive: true }
    });
    console.log(`  - Admin: ${admin.email}`);

    // Officials
    const officialData = [
      { name: 'Ramesh Kumar', email: 'ramesh.official@civicsense.ai', department: 'Public Works Department' },
      { name: 'Sita Devi', email: 'sita.official@civicsense.ai', department: 'Sanitation Department' },
      { name: 'Anil Sharma', email: 'anil.official@civicsense.ai', department: 'Electricity Board' },
      { name: 'Geeta Rao', email: 'geeta.official@civicsense.ai', department: 'Water Supply Department' },
      { name: 'Vikram Singh', email: 'vikram.official@civicsense.ai', department: 'Drainage Department' }
    ];

    const officials = {};
    for (const od of officialData) {
      const [official] = await User.findOrCreate({
        where: { email: od.email },
        defaults: { name: od.name, password: 'official123', role: 'official', department: od.department, isActive: true }
      });
      officials[od.department] = official;
      console.log(`  - Official: ${od.email} (${od.department})`);
    }

    // Citizens
    const citizenData = [
      { name: 'Priya Patel', email: 'priya.citizen@civicsense.ai', ward: 'Ward 3' },
      { name: 'Rahul Verma', email: 'rahul.citizen@civicsense.ai', ward: 'Ward 5' },
      { name: 'Sunita Reddy', email: 'sunita.citizen@civicsense.ai', ward: 'Ward 2' },
      { name: 'Ajay Gupta', email: 'ajay.citizen@civicsense.ai', ward: 'Ward 7' },
      { name: 'Meera Joshi', email: 'meera.citizen@civicsense.ai', ward: 'Ward 4' },
      { name: 'Kavita Nair', email: 'kavita.citizen@civicsense.ai', ward: 'Ward 3' },
      { name: 'Deepak Malhotra', email: 'deepak.citizen@civicsense.ai', ward: 'Ward 5' },
      { name: 'Neha Sharma', email: 'neha.citizen@civicsense.ai', ward: 'Ward 2' }
    ];

    const citizens = [];
    for (const cd of citizenData) {
      const [citizen] = await User.findOrCreate({
        where: { email: cd.email },
        defaults: { name: cd.name, password: 'citizen123', role: 'citizen', ward: cd.ward, isActive: true }
      });
      citizens.push(citizen);
      console.log(`  - Citizen: ${cd.email}`);
    }

    // Seed departments
    console.log('Seeding departments...');
    const deptList = [...new Set(Object.values(DEPARTMENTS))];
    for (const deptName of deptList) {
      await Department.findOrCreate({
        where: { name: deptName },
        defaults: {
          description: `Handles complaints related to ${deptName.toLowerCase()}`,
          headOfDepartmentId: officials[deptName]?.id || null,
          isActive: true,
          assignedWards: '[]'
        }
      });
    }
    console.log(`  - Seeded ${deptList.length} departments`);

    // Seed complaints.
    // Each entry has an optional `cluster` key. Entries sharing a cluster key are
    // auto-linked into a cluster after creation (first = root, rest = members).
    console.log('Seeding complaints...');
    const sampleComplaints = [
      // ---- Cluster A: Potholes on Main Road (Public Works) ----
      { title: 'Pothole on Main Road near Market', description: 'There is a large and dangerous pothole on Main Road near the market that has caused several accidents. It is getting bigger every day and is a serious hazard for vehicles and pedestrians.', type: 'pothole', priority: 4, priorityLabel: 'Critical', department: 'Public Works Department', locLat: 20.5937, locLng: 78.9629, locAddress: 'Main Road near Market', locWard: 'Ward 3', cluster: 'A' },
      { title: 'Another pothole on Main Road', description: 'Another new pothole has appeared on Main Road near the market, close to where the old one was. It is dangerous for bikes and could cause accidents.', type: 'pothole', priority: 4, priorityLabel: 'Critical', department: 'Public Works Department', locLat: 20.5942, locLng: 78.9634, locAddress: 'Main Road near Market', locWard: 'Ward 3', cluster: 'A' },
      { title: 'Deep potholes near the bus stand', description: 'There are deep potholes near the bus stand on Main Road that damage vehicles and are very hard to avoid, especially at night. Buses and motorcycles slow to a crawl.', type: 'pothole', priority: 3, priorityLabel: 'High', department: 'Public Works Department', locLat: 20.5951, locLng: 78.9645, locAddress: 'Main Road Bus Stand', locWard: 'Ward 3', cluster: 'A' },

      // ---- Cluster B: Garbage in Residential Colony (Sanitation) ----
      { title: 'Garbage not collected for two weeks', description: 'Garbage has not been collected in our area for two weeks now. The bins are overflowing and there is a very bad smell. This is a health risk for residents, especially children playing outside.', type: 'garbage', priority: 3, priorityLabel: 'High', department: 'Sanitation Department', locLat: 20.5940, locLng: 78.9640, locAddress: 'Residential Colony', locWard: 'Ward 5', cluster: 'B' },
      { title: 'Overflowing garbage bins in the colony', description: 'The garbage bins in our colony have been overflowing for days and nobody collects the waste. The smell is unbearable and stray animals keep scattering the trash.', type: 'garbage', priority: 3, priorityLabel: 'High', department: 'Sanitation Department', locLat: 20.5946, locLng: 78.9647, locAddress: 'Residential Colony Block C', locWard: 'Ward 5', cluster: 'B' },
      { title: 'Garbage pile attracting stray animals', description: 'A huge garbage pile has formed near the colony entrance and is attracting stray animals and flies. Waste has not been collected for many days and it is unhygienic.', type: 'garbage', priority: 3, priorityLabel: 'High', department: 'Sanitation Department', locLat: 20.5953, locLng: 78.9653, locAddress: 'Residential Colony Entrance', locWard: 'Ward 5', cluster: 'B' },

      // ---- Cluster C: Broken streetlights on Park Avenue (Electricity) ----
      { title: 'Streetlight broken on Park Avenue', description: 'The streetlight on Park Avenue has been broken for over a month. The street is completely dark at night, making it unsafe to walk. This is a safety concern for residents.', type: 'broken_streetlight', priority: 2, priorityLabel: 'Medium', department: 'Electricity Board', locLat: 20.5950, locLng: 78.9660, locAddress: 'Park Avenue', locWard: 'Ward 2', cluster: 'C' },
      { title: 'Several streetlights not working on Park Avenue', description: 'Multiple streetlights along Park Avenue are not working and the whole stretch is dark at night. It feels unsafe for pedestrians and anti-social activity is a concern.', type: 'broken_streetlight', priority: 3, priorityLabel: 'High', department: 'Electricity Board', locLat: 20.5957, locLng: 78.9668, locAddress: 'Park Avenue north end', locWard: 'Ward 2', cluster: 'C' },
      { title: 'Dark stretch on Park Avenue walkway', description: 'The walkway on Park Avenue is completely dark because the streetlights are broken. Elderly residents avoid going out in the evening because of the darkness.', type: 'broken_streetlight', priority: 2, priorityLabel: 'Medium', department: 'Electricity Board', locLat: 20.5964, locLng: 78.9675, locAddress: 'Park Avenue walkway', locWard: 'Ward 2', cluster: 'C' },

      // ---- Cluster D: Water leak on College Road (Water Supply) ----
      { title: 'Water leak from main pipe', description: 'There is a major water leak from a main pipe on College Road. Water has been flowing continuously for days and is creating flooding. This is wasting a lot of water urgently.', type: 'water_leakage', priority: 3, priorityLabel: 'High', department: 'Water Supply Department', locLat: 20.5960, locLng: 78.9680, locAddress: 'College Road', locWard: 'Ward 7', cluster: 'D' },
      { title: 'Water leakage near College Road junction', description: 'Water is leaking from the main supply pipe near the College Road junction. It has been going on for several days and a large pool of water has formed.', type: 'water_leakage', priority: 3, priorityLabel: 'High', department: 'Water Supply Department', locLat: 20.5966, locLng: 78.9687, locAddress: 'College Road Junction', locWard: 'Ward 7', cluster: 'D' },
      { title: 'Pipe burst flooding College Road', description: 'A water pipe burst on College Road is flooding the street and wasting huge amounts of water. This has created a safety hazard and needs urgent repair.', type: 'water_leakage', priority: 4, priorityLabel: 'Critical', department: 'Water Supply Department', locLat: 20.5973, locLng: 78.9694, locAddress: 'College Road near bus stop', locWard: 'Ward 7', cluster: 'D' },

      // ---- Standalone (non-clustered) complaints for analytics variety ----
      { title: 'Blocked drainage causing flooding', description: 'The drainage system in Shivaji Nagar is completely blocked and causing flooding whenever it rains. Water stagnates for days, breeding mosquitoes. This is a growing problem every monsoon.', type: 'drainage', priority: 3, priorityLabel: 'High', department: 'Drainage Department', locLat: 20.5970, locLng: 78.9700, locAddress: 'Shivaji Nagar', locWard: 'Ward 4', cluster: null },
      { title: 'Stray dogs menace in colony', description: 'There are many stray dogs in our colony that have become aggressive, especially at night. Residents are worried about safety of children and elderly.', type: 'stray_animals', priority: 3, priorityLabel: 'High', department: 'Animal Control', locLat: 20.5990, locLng: 78.9720, locAddress: 'Green Colony', locWard: 'Ward 5', cluster: null },
      { title: 'Frequent power cuts during summer', description: 'We are facing frequent power cuts in our area, sometimes 4-5 times a day. This is especially terrible during the hot summer months and affects daily life.', type: 'electricity', priority: 2, priorityLabel: 'Medium', department: 'Electricity Board', locLat: 20.6010, locLng: 78.9740, locAddress: 'Jai Nagar', locWard: 'Ward 2', cluster: null },
      { title: 'Sewage overflow on Church Street', description: 'Sewage is overflowing from a manhole on Church Street, creating a foul smell and unhygienic conditions. This is a serious health risk for the residents nearby.', type: 'sewage', priority: 4, priorityLabel: 'Critical', department: 'Sanitation Department', locLat: 20.6030, locLng: 78.9760, locAddress: 'Church Street', locWard: 'Ward 7', cluster: null },
      { title: 'Noise pollution from construction site', description: 'A construction site near our homes is producing excessive noise even at night. This is disturbing the entire neighborhood and is very frustrating for residents.', type: 'noise_pollution', priority: 2, priorityLabel: 'Medium', department: 'Environmental Department', locLat: 20.6050, locLng: 78.9780, locAddress: 'Sector 4', locWard: 'Ward 4', cluster: null }
    ];

    const statuses = [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW, COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.RESOLVED];
    const createdComplaints = [];

    for (let i = 0; i < sampleComplaints.length; i++) {
      const sc = sampleComplaints[i];
      const status = statuses[i % statuses.length];
      const reporter = citizens[i % citizens.length];
      const official = officials[sc.department];

      const history = [{
        status: COMPLAINT_STATUS.SUBMITTED,
        updatedBy: reporter.id,
        note: 'Complaint submitted',
        timestamp: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString()
      }];

      if (['under_review', 'assigned', 'in_progress', 'resolved'].includes(status)) {
        history.push({
          status: COMPLAINT_STATUS.UNDER_REVIEW,
          updatedBy: official?.id || admin.id,
          note: 'Complaint under review',
          timestamp: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      if (['assigned', 'in_progress', 'resolved'].includes(status)) {
        history.push({
          status: COMPLAINT_STATUS.ASSIGNED,
          updatedBy: official?.id || admin.id,
          note: 'Assigned to department official',
          timestamp: new Date(Date.now() - (i + 1) * 1.5 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      if (['in_progress', 'resolved'].includes(status)) {
        history.push({
          status: COMPLAINT_STATUS.IN_PROGRESS,
          updatedBy: official?.id || admin.id,
          note: 'Work in progress',
          timestamp: new Date(Date.now() - (i + 1) * 0.8 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      if (status === COMPLAINT_STATUS.RESOLVED) {
        history.push({
          status: COMPLAINT_STATUS.RESOLVED,
          updatedBy: official?.id || admin.id,
          note: 'Issue resolved. Proof attached.',
          timestamp: new Date(Date.now() - (i + 1) * 0.3 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      const complaint = await Complaint.create({
        title: sc.title,
        description: sc.description,
        type: sc.type,
        priority: sc.priority,
        priorityLabel: sc.priorityLabel,
        department: sc.department,
        locLat: sc.locLat, locLng: sc.locLng, locAddress: sc.locAddress,
        locWard: sc.locWard, locCity: 'Sample City', locState: 'Sample State',
        reportedById: reporter.id,
        assignedToId: ['assigned', 'in_progress', 'resolved'].includes(status) ? (official?.id || null) : null,
        status,
        statusHistory: JSON.stringify(history),
        images: '[]',
        similarComplaints: '[]',
        resolutionProof: status === COMPLAINT_STATUS.RESOLVED
          ? JSON.stringify({ notes: 'Issue resolved successfully.', resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() })
          : '{}',
        aiAnalysis: JSON.stringify({
          classification: sc.type,
          confidence: 0.85,
          sentimentScore: -0.5,
          sentimentLabel: 'negative',
          keywords: sc.title.toLowerCase().split(' ').slice(0, 5),
          analyzedAt: new Date()
        })
      });

      createdComplaints.push({ complaint, cluster: sc.cluster });
      console.log(`  - Complaint: "${sc.title}" [${status}]${sc.cluster ? ` (cluster ${sc.cluster})` : ''}`);
    }

    // Wire up clusters: group complaints sharing a cluster key.
    // root = first in group; root.clusterId = own id; members.clusterId = root.id;
    // similarComplaints link members to the root (mirrors runtime behaviour).
    const groups = {};
    createdComplaints.forEach(entry => {
      if (entry.cluster) {
        (groups[entry.cluster] = groups[entry.cluster] || []).push(entry.complaint);
      }
    });

    let clustersCreated = 0;
    for (const key of Object.keys(groups)) {
      const members = groups[key];
      if (members.length < 2) continue;
      const root = members[0];
      // Root anchors the cluster (clusterId == own id)
      await root.update({ clusterId: root.id });
      const links = members.slice(1).map(m => ({ complaint: m.id, similarityScore: 0.84 }));
      await root.update({ similarComplaints: JSON.stringify(links) });

      for (const member of members.slice(1)) {
        await member.update({ clusterId: root.id });
        await member.update({
          similarComplaints: JSON.stringify([{ complaint: root.id, similarityScore: 0.84 }])
        });
      }
      clustersCreated += 1;
      console.log(`  - Created cluster "${key}": ${members.length} complaints (root: ${root.id})`);
    }
    console.log(`  - Total clusters: ${clustersCreated}`);

    // Attach citizen reviews (satisfactionRating + feedback) to some RESOLVED
    // complaints so the citizen-portal review loop has demo data to showcase.
    console.log('Seeding citizen reviews on resolved complaints...');
    const reviewRatings = [5, 4, 3, 5];
    const reviewFeedbacks = [
      'Work was completed quickly and well. Very satisfied.',
      'Fixed within a few days, but the road was closed longer than expected.',
      'Resolved eventually, but took longer than promised.',
      'Prompt response and the issue is fully fixed now. Thank you!'
    ];
    const reviewUpdates = [];
    let reviewCount = 0;
    createdComplaints.forEach((entry) => {
      if (entry.complaint.status !== COMPLAINT_STATUS.RESOLVED || reviewCount >= 4) return;
      const rating = reviewRatings[reviewCount];
      const feedback = reviewFeedbacks[reviewCount];
      reviewUpdates.push(
        entry.complaint.update({ satisfactionRating: rating, feedback }).then(() => {
          console.log(`  - Review on complaint #${entry.complaint.id}: ${rating}/5`);
        })
      );
      reviewCount += 1;
    });
    await Promise.all(reviewUpdates);

    // Clean up any stale activity logs
    await ActivityLog.destroy({ where: {}, force: true });

    console.log('\n✅ Seed data created successfully!');
    console.log('\nTotal complaints seeded: ' + createdComplaints.length);
    console.log(`Total clusters seeded: ${clustersCreated}`);
    console.log('\nLogin credentials:');
    console.log('  Admin:    admin@civicsense.ai / admin123');
    console.log('  Official: sita.official@civicsense.ai / official123');
    console.log('  Citizen:  priya.citizen@civicsense.ai / citizen123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();