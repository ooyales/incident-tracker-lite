"""Seed data for Incident Tracker Lite."""
import uuid
from app.extensions import db
from app.models.incident import Incident
from app.models.timeline_entry import TimelineEntry
from app.models.incident_asset import IncidentAsset
from app.models.incident_responder import IncidentResponder
from app.models.problem import Problem
from app.models.communication import Communication
from app.models.sla_target import SLATarget
from app.services.incident_number import IncidentCounter

# Deterministic namespace for uuid5
NS = uuid.UUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')


def _id(name):
    """Generate deterministic UUID from a name."""
    return str(uuid.uuid5(NS, name))


def seed():
    """Seed the database with sample data."""
    session_id = '__default__'

    # ── SLA Targets ──────────────────────────────────────────────────
    sla_targets = [
        SLATarget(
            id=_id('sla-critical'),
            severity='critical',
            response_target_minutes=15,
            resolution_target_minutes=240,
            session_id=session_id,
        ),
        SLATarget(
            id=_id('sla-high'),
            severity='high',
            response_target_minutes=30,
            resolution_target_minutes=480,
            session_id=session_id,
        ),
        SLATarget(
            id=_id('sla-medium'),
            severity='medium',
            response_target_minutes=120,
            resolution_target_minutes=1440,
            session_id=session_id,
        ),
        SLATarget(
            id=_id('sla-low'),
            severity='low',
            response_target_minutes=480,
            resolution_target_minutes=4320,
            session_id=session_id,
        ),
    ]
    for t in sla_targets:
        db.session.add(t)

    # ── Incident Counters ────────────────────────────────────────────
    inc_counter = IncidentCounter(
        counter_type='incident',
        year=2026,
        last_number=9,
    )
    db.session.add(inc_counter)

    prb_counter = IncidentCounter(
        counter_type='problem',
        year=2026,
        last_number=2,
    )
    db.session.add(prb_counter)

    # ── Problems ─────────────────────────────────────────────────────
    prb1_id = _id('prb-2026-0001')
    prb1 = Problem(
        id=prb1_id,
        problem_number='PRB-2026-0001',
        title='NAS storage fills up monthly',
        description='CUI file share NAS storage reaches capacity approximately every 30 days',
        root_cause='No log rotation configured on CUI file share NAS',
        root_cause_category='capacity',
        permanent_fix='Implement automated log rotation + capacity alerting at 80%',
        fix_status='in_progress',
        fix_owner='Mike Torres',
        fix_due_date='2026-03-01',
        incident_count=3,
        total_downtime_minutes=135,
        known_error=1,
        wiki_url='https://wiki.example.com/known-errors/nas-capacity',
        workaround='Manually clear /var/log/old when disk exceeds 90%',
        priority='high',
        created_at='2026-01-15T10:30:00',
        updated_at='2026-01-15T10:30:00',
        session_id=session_id,
    )
    db.session.add(prb1)

    prb2_id = _id('prb-2026-0002')
    prb2 = Problem(
        id=prb2_id,
        problem_number='PRB-2026-0002',
        title='VPN tunnel drops during peak hours',
        description='VPN connections drop intermittently during morning and afternoon peak usage',
        root_cause='Firewall session table limit too low for current user count',
        root_cause_category='config',
        permanent_fix='Upgrade firewall to support 100K sessions, implement QoS',
        fix_status='open',
        fix_owner='Network Team',
        fix_due_date='2026-03-15',
        incident_count=2,
        total_downtime_minutes=240,
        known_error=1,
        workaround='Stagger VPN connections, limit non-essential traffic during peak',
        priority='high',
        created_at='2026-01-25T11:00:00',
        updated_at='2026-01-25T11:00:00',
        session_id=session_id,
    )
    db.session.add(prb2)

    # ── Incident 1: CUI file share inaccessible ─────────────────────
    inc1_id = _id('inc-2026-0001')
    inc1 = Incident(
        id=inc1_id,
        incident_number='INC-2026-0001',
        title='CUI file share inaccessible',
        description='Multiple users reporting they cannot access the controlled unclassified information file share.',
        severity='critical',
        category='outage',
        status='resolved',
        reported_at='2026-01-15T09:15:00',
        detected_at='2026-01-15T09:10:00',
        acknowledged_at='2026-01-15T09:18:00',
        resolved_at='2026-01-15T10:00:00',
        impact_description='15 users unable to access controlled files',
        users_affected=15,
        business_impact='critical',
        data_breach=0,
        reported_by='Sarah Chen',
        assigned_to='Mike Torres',
        resolved_by='Mike Torres',
        resolution_summary='Disk space cleared on NAS, temp files removed, service restored',
        root_cause='NAS storage at 99% capacity due to unrotated logs',
        post_incident_completed=1,
        lessons_learned='Need automated capacity monitoring',
        preventive_actions='Implement log rotation and 80% capacity alerts',
        problem_id=prb1_id,
        created_at='2026-01-15T09:15:00',
        updated_at='2026-01-15T10:00:00',
        session_id=session_id,
    )
    db.session.add(inc1)

    # INC-1 Timeline
    inc1_timeline = [
        TimelineEntry(
            id=_id('tl-inc1-01'),
            incident_id=inc1_id,
            entry_type='update',
            content='Incident reported: Multiple users unable to access CUI file share',
            author='Sarah Chen',
            created_at='2026-01-15T09:15:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc1-02'),
            incident_id=inc1_id,
            entry_type='status_change',
            content='Mike Torres acknowledged and began investigation',
            author='Mike Torres',
            created_at='2026-01-15T09:18:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc1-03'),
            incident_id=inc1_id,
            entry_type='update',
            content='Checked NAS dashboard - disk at 99% capacity',
            author='Mike Torres',
            created_at='2026-01-15T09:25:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc1-04'),
            incident_id=inc1_id,
            entry_type='status_change',
            content='Identified root cause: /var/log not rotated, consuming 200GB',
            author='Mike Torres',
            created_at='2026-01-15T09:35:00',
            old_status='investigating',
            new_status='identified',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc1-05'),
            incident_id=inc1_id,
            entry_type='status_change',
            content='Clearing temp files and old logs, monitoring service',
            author='Mike Torres',
            created_at='2026-01-15T09:45:00',
            old_status='identified',
            new_status='monitoring',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc1-06'),
            incident_id=inc1_id,
            entry_type='resolution',
            content='File share restored. Disk at 45% after cleanup.',
            author='Mike Torres',
            created_at='2026-01-15T10:00:00',
            old_status='monitoring',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc1_timeline:
        db.session.add(tl)

    # INC-1 Assets
    inc1_assets = [
        IncidentAsset(
            id=_id('asset-inc1-01'),
            incident_id=inc1_id,
            asset_name='NAS-01 CUI File Server',
            asset_type='storage',
            impact_type='primary',
            notes='Primary NAS for CUI data storage',
            session_id=session_id,
        ),
        IncidentAsset(
            id=_id('asset-inc1-02'),
            incident_id=inc1_id,
            asset_name='SharePoint Gateway',
            asset_type='application',
            impact_type='secondary',
            notes='Gateway service was affected by NAS outage',
            session_id=session_id,
        ),
    ]
    for a in inc1_assets:
        db.session.add(a)

    # INC-1 Responders
    inc1_responders = [
        IncidentResponder(
            id=_id('resp-inc1-01'),
            incident_id=inc1_id,
            person_name='Mike Torres',
            role='lead',
            assigned_at='2026-01-15T09:18:00',
            session_id=session_id,
        ),
        IncidentResponder(
            id=_id('resp-inc1-02'),
            incident_id=inc1_id,
            person_name='Sarah Chen',
            role='comms',
            assigned_at='2026-01-15T09:20:00',
            session_id=session_id,
        ),
    ]
    for r in inc1_responders:
        db.session.add(r)

    # ── Incident 2: Email delays ─────────────────────────────────────
    inc2_id = _id('inc-2026-0002')
    inc2 = Incident(
        id=inc2_id,
        incident_number='INC-2026-0002',
        title='Email delays for all staff',
        description='All outbound and inbound email experiencing 30+ minute delays.',
        severity='high',
        category='degradation',
        status='resolved',
        reported_at='2026-01-20T14:30:00',
        acknowledged_at='2026-01-20T14:35:00',
        resolved_at='2026-01-20T15:45:00',
        impact_description='Email delivery delayed 30+ minutes',
        users_affected=45,
        business_impact='high',
        data_breach=0,
        reported_by='Help Desk',
        assigned_to='Alex Kim',
        resolved_by='Alex Kim',
        resolution_summary='Restarted mail transport agents, cleared message queue',
        root_cause='Mail transport agent queue backed up due to spam filter misconfiguration',
        created_at='2026-01-20T14:30:00',
        updated_at='2026-01-20T15:45:00',
        session_id=session_id,
    )
    db.session.add(inc2)

    # INC-2 Timeline
    inc2_timeline = [
        TimelineEntry(
            id=_id('tl-inc2-01'),
            incident_id=inc2_id,
            entry_type='update',
            content='Multiple staff reporting delayed email delivery, 30+ minutes',
            author='Help Desk',
            created_at='2026-01-20T14:30:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc2-02'),
            incident_id=inc2_id,
            entry_type='status_change',
            content='Alex Kim investigating mail transport agents',
            author='Alex Kim',
            created_at='2026-01-20T14:35:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc2-03'),
            incident_id=inc2_id,
            entry_type='status_change',
            content='Found spam filter misconfiguration causing queue backup, correcting settings',
            author='Alex Kim',
            created_at='2026-01-20T15:15:00',
            old_status='investigating',
            new_status='identified',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc2-04'),
            incident_id=inc2_id,
            entry_type='resolution',
            content='Mail transport agents restarted, queue cleared, email flow restored',
            author='Alex Kim',
            created_at='2026-01-20T15:45:00',
            old_status='identified',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc2_timeline:
        db.session.add(tl)

    # INC-2 Assets
    db.session.add(IncidentAsset(
        id=_id('asset-inc2-01'),
        incident_id=inc2_id,
        asset_name='MAIL-01 Exchange Server',
        asset_type='server',
        impact_type='primary',
        notes='Primary Exchange mail transport server',
        session_id=session_id,
    ))

    # ── Incident 3: VPN drops ────────────────────────────────────────
    inc3_id = _id('inc-2026-0003')
    inc3 = Incident(
        id=inc3_id,
        incident_number='INC-2026-0003',
        title='VPN connection drops for remote staff',
        description='Remote workers experiencing intermittent VPN disconnections during work hours.',
        severity='high',
        category='outage',
        status='resolved',
        reported_at='2026-01-25T08:00:00',
        acknowledged_at='2026-01-25T08:15:00',
        resolved_at='2026-01-25T10:00:00',
        impact_description='Remote staff VPN connections dropping every 15-20 minutes',
        users_affected=12,
        business_impact='high',
        data_breach=0,
        reported_by='Remote Team Lead',
        assigned_to='Mike Torres',
        resolved_by='Mike Torres',
        resolution_summary='Increased firewall session table limit from 10K to 50K',
        root_cause='Firewall session table exhausted during peak usage',
        problem_id=prb2_id,
        created_at='2026-01-25T08:00:00',
        updated_at='2026-01-25T10:00:00',
        session_id=session_id,
    )
    db.session.add(inc3)

    # INC-3 Timeline
    inc3_timeline = [
        TimelineEntry(
            id=_id('tl-inc3-01'),
            incident_id=inc3_id,
            entry_type='update',
            content='Remote Team Lead reports VPN drops for multiple staff members',
            author='Remote Team Lead',
            created_at='2026-01-25T08:00:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc3-02'),
            incident_id=inc3_id,
            entry_type='status_change',
            content='Mike Torres investigating firewall and VPN concentrator logs',
            author='Mike Torres',
            created_at='2026-01-25T08:15:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc3-03'),
            incident_id=inc3_id,
            entry_type='status_change',
            content='Session table at 9,800/10,000 — identified as root cause',
            author='Mike Torres',
            created_at='2026-01-25T08:45:00',
            old_status='investigating',
            new_status='identified',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc3-04'),
            incident_id=inc3_id,
            entry_type='status_change',
            content='Increased session limit to 50K, monitoring connections',
            author='Mike Torres',
            created_at='2026-01-25T09:15:00',
            old_status='identified',
            new_status='monitoring',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc3-05'),
            incident_id=inc3_id,
            entry_type='resolution',
            content='VPN stable for 45 minutes with new session limit. Incident resolved.',
            author='Mike Torres',
            created_at='2026-01-25T10:00:00',
            old_status='monitoring',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc3_timeline:
        db.session.add(tl)

    # INC-3 Assets
    db.session.add(IncidentAsset(
        id=_id('asset-inc3-01'),
        incident_id=inc3_id,
        asset_name='FW-01 Cisco ASA Firewall',
        asset_type='network',
        impact_type='primary',
        notes='Primary perimeter firewall and VPN concentrator',
        session_id=session_id,
    ))

    # ── Incident 4: Printer not responding ───────────────────────────
    inc4_id = _id('inc-2026-0004')
    inc4 = Incident(
        id=inc4_id,
        incident_number='INC-2026-0004',
        title='Printer not responding in main office',
        description='Main office printer (HP LaserJet) not responding to print jobs.',
        severity='low',
        category='outage',
        status='resolved',
        reported_at='2026-02-01T11:00:00',
        acknowledged_at='2026-02-01T11:30:00',
        resolved_at='2026-02-01T14:00:00',
        impact_description='Main office printer offline, users redirected to 2nd floor printer',
        users_affected=8,
        business_impact='low',
        data_breach=0,
        reported_by='Office Manager',
        assigned_to='Help Desk',
        resolved_by='Help Desk',
        resolution_summary='Replaced toner cartridge and cleared paper jam',
        root_cause='Paper jam in tray 2 and low toner',
        created_at='2026-02-01T11:00:00',
        updated_at='2026-02-01T14:00:00',
        session_id=session_id,
    )
    db.session.add(inc4)

    # INC-4 Timeline
    inc4_timeline = [
        TimelineEntry(
            id=_id('tl-inc4-01'),
            incident_id=inc4_id,
            entry_type='update',
            content='Office manager reports main office printer not responding',
            author='Office Manager',
            created_at='2026-02-01T11:00:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc4-02'),
            incident_id=inc4_id,
            entry_type='update',
            content='Help Desk dispatched to check printer, found paper jam and low toner',
            author='Help Desk',
            created_at='2026-02-01T11:30:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc4-03'),
            incident_id=inc4_id,
            entry_type='resolution',
            content='Paper jam cleared, toner replaced, printer operational',
            author='Help Desk',
            created_at='2026-02-01T14:00:00',
            old_status='investigating',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc4_timeline:
        db.session.add(tl)

    # ── Incident 5: Nessus scan failed ───────────────────────────────
    inc5_id = _id('inc-2026-0005')
    inc5 = Incident(
        id=inc5_id,
        incident_number='INC-2026-0005',
        title='Nessus vulnerability scan failed to complete',
        description='Scheduled weekly Nessus vulnerability scan timed out at 60% completion.',
        severity='low',
        category='degradation',
        status='resolved',
        reported_at='2026-02-03T06:00:00',
        acknowledged_at='2026-02-03T08:00:00',
        resolved_at='2026-02-04T10:00:00',
        impact_description='Weekly vulnerability scan incomplete, compliance gap',
        users_affected=0,
        business_impact='moderate',
        data_breach=0,
        reported_by='Security Team',
        assigned_to='Security Team',
        resolved_by='Security Team',
        resolution_summary='Updated Nessus plugins and increased scan timeout',
        root_cause='Outdated plugins causing slow scan, timeout too aggressive',
        created_at='2026-02-03T06:00:00',
        updated_at='2026-02-04T10:00:00',
        session_id=session_id,
    )
    db.session.add(inc5)

    # INC-5 Timeline
    inc5_timeline = [
        TimelineEntry(
            id=_id('tl-inc5-01'),
            incident_id=inc5_id,
            entry_type='update',
            content='Automated alert: Weekly Nessus scan failed at 60% completion',
            author='Security Team',
            created_at='2026-02-03T06:00:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc5-02'),
            incident_id=inc5_id,
            entry_type='update',
            content='Security team reviewing scan logs, plugins appear outdated',
            author='Security Team',
            created_at='2026-02-03T08:00:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc5-03'),
            incident_id=inc5_id,
            entry_type='resolution',
            content='Plugins updated, scan timeout increased to 8 hours, re-scan completed successfully',
            author='Security Team',
            created_at='2026-02-04T10:00:00',
            old_status='investigating',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc5_timeline:
        db.session.add(tl)

    # INC-5 Assets
    db.session.add(IncidentAsset(
        id=_id('asset-inc5-01'),
        incident_id=inc5_id,
        asset_name='SCAN-01 Nessus Scanner',
        asset_type='security',
        impact_type='primary',
        notes='Primary vulnerability scanner appliance',
        session_id=session_id,
    ))

    # ── Incident 6: AD replication failure ───────────────────────────
    inc6_id = _id('inc-2026-0006')
    inc6 = Incident(
        id=inc6_id,
        incident_number='INC-2026-0006',
        title='Active Directory replication failure',
        description='DC-02 not replicating from DC-01, replication lag exceeding 2 hours.',
        severity='high',
        category='degradation',
        status='resolved',
        reported_at='2026-02-05T07:30:00',
        acknowledged_at='2026-02-05T07:35:00',
        resolved_at='2026-02-05T09:00:00',
        impact_description='AD replication lag causing login delays and stale group policy',
        users_affected=50,
        business_impact='high',
        data_breach=0,
        reported_by='Monitoring System',
        assigned_to='Alex Kim',
        resolved_by='Alex Kim',
        resolution_summary='Restarted NTDS service, forced replication',
        root_cause='NTDS service hung after Windows update on DC-02',
        created_at='2026-02-05T07:30:00',
        updated_at='2026-02-05T09:00:00',
        session_id=session_id,
    )
    db.session.add(inc6)

    # INC-6 Timeline
    inc6_timeline = [
        TimelineEntry(
            id=_id('tl-inc6-01'),
            incident_id=inc6_id,
            entry_type='update',
            content='Monitoring alert: AD replication lag >2 hours between DC-01 and DC-02',
            author='Monitoring System',
            created_at='2026-02-05T07:30:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc6-02'),
            incident_id=inc6_id,
            entry_type='status_change',
            content='Alex Kim checking replication status and NTDS service health',
            author='Alex Kim',
            created_at='2026-02-05T07:35:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc6-03'),
            incident_id=inc6_id,
            entry_type='status_change',
            content='NTDS service on DC-02 hung after recent Windows update, restarting service',
            author='Alex Kim',
            created_at='2026-02-05T08:15:00',
            old_status='investigating',
            new_status='identified',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc6-04'),
            incident_id=inc6_id,
            entry_type='resolution',
            content='NTDS restarted, forced replication completed, all objects in sync',
            author='Alex Kim',
            created_at='2026-02-05T09:00:00',
            old_status='identified',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc6_timeline:
        db.session.add(tl)

    # INC-6 Assets
    inc6_assets = [
        IncidentAsset(
            id=_id('asset-inc6-01'),
            incident_id=inc6_id,
            asset_name='DC-01 Domain Controller',
            asset_type='server',
            impact_type='primary',
            notes='Primary domain controller',
            session_id=session_id,
        ),
        IncidentAsset(
            id=_id('asset-inc6-02'),
            incident_id=inc6_id,
            asset_name='DC-02 Backup DC',
            asset_type='server',
            impact_type='secondary',
            notes='Secondary domain controller, replication target',
            session_id=session_id,
        ),
    ]
    for a in inc6_assets:
        db.session.add(a)

    # ── Incident 7: Backup job failed ────────────────────────────────
    inc7_id = _id('inc-2026-0007')
    inc7 = Incident(
        id=inc7_id,
        incident_number='INC-2026-0007',
        title='Backup job failed for CUI servers',
        description='Nightly backup job for CUI servers failed with tape drive error.',
        severity='medium',
        category='data_loss',
        status='resolved',
        reported_at='2026-02-07T07:00:00',
        acknowledged_at='2026-02-07T07:30:00',
        resolved_at='2026-02-07T12:00:00',
        impact_description='CUI server backup incomplete, data at risk until re-run',
        users_affected=0,
        business_impact='moderate',
        data_breach=0,
        reported_by='Backup Monitoring',
        assigned_to='Mike Torres',
        resolved_by='Mike Torres',
        resolution_summary='Replaced failed backup tape, re-ran backup successfully',
        root_cause='Tape media failure in LTO drive',
        created_at='2026-02-07T07:00:00',
        updated_at='2026-02-07T12:00:00',
        session_id=session_id,
    )
    db.session.add(inc7)

    # INC-7 Timeline
    inc7_timeline = [
        TimelineEntry(
            id=_id('tl-inc7-01'),
            incident_id=inc7_id,
            entry_type='update',
            content='Automated alert: Nightly CUI backup job failed with tape error',
            author='Backup Monitoring',
            created_at='2026-02-07T07:00:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc7-02'),
            incident_id=inc7_id,
            entry_type='status_change',
            content='Mike Torres investigating tape drive and media status',
            author='Mike Torres',
            created_at='2026-02-07T07:30:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc7-03'),
            incident_id=inc7_id,
            entry_type='status_change',
            content='Tape media confirmed bad, replacing with new tape from stock',
            author='Mike Torres',
            created_at='2026-02-07T09:00:00',
            old_status='investigating',
            new_status='identified',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc7-04'),
            incident_id=inc7_id,
            entry_type='resolution',
            content='New tape installed, backup re-run completed successfully with full verification',
            author='Mike Torres',
            created_at='2026-02-07T12:00:00',
            old_status='identified',
            new_status='resolved',
            session_id=session_id,
        ),
    ]
    for tl in inc7_timeline:
        db.session.add(tl)

    # ── Incident 8: M365 email delays (ACTIVE) ──────────────────────
    inc8_id = _id('inc-2026-0008')
    inc8 = Incident(
        id=inc8_id,
        incident_number='INC-2026-0008',
        title='Microsoft 365 email delays',
        description='Users reporting intermittent delays on outbound email via M365 GCC.',
        severity='medium',
        category='degradation',
        status='investigating',
        reported_at='2026-02-12T08:30:00',
        acknowledged_at='2026-02-12T08:45:00',
        impact_description='Intermittent delays on outbound email',
        users_affected=30,
        business_impact='moderate',
        data_breach=0,
        reported_by='Help Desk',
        assigned_to='Alex Kim',
        created_at='2026-02-12T08:30:00',
        updated_at='2026-02-12T09:15:00',
        session_id=session_id,
    )
    db.session.add(inc8)

    # INC-8 Timeline
    inc8_timeline = [
        TimelineEntry(
            id=_id('tl-inc8-01'),
            incident_id=inc8_id,
            entry_type='update',
            content='Multiple users reporting slow email delivery',
            author='Help Desk',
            created_at='2026-02-12T08:30:00',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc8-02'),
            incident_id=inc8_id,
            entry_type='status_change',
            content='Alex Kim investigating M365 service health dashboard',
            author='Alex Kim',
            created_at='2026-02-12T08:45:00',
            old_status='open',
            new_status='investigating',
            session_id=session_id,
        ),
        TimelineEntry(
            id=_id('tl-inc8-03'),
            incident_id=inc8_id,
            entry_type='update',
            content='Microsoft acknowledges degraded service in US East region',
            author='Alex Kim',
            created_at='2026-02-12T09:15:00',
            session_id=session_id,
        ),
    ]
    for tl in inc8_timeline:
        db.session.add(tl)

    # INC-8 Assets
    db.session.add(IncidentAsset(
        id=_id('asset-inc8-01'),
        incident_id=inc8_id,
        asset_name='M365 GCC Email Service',
        asset_type='cloud_service',
        impact_type='primary',
        notes='Microsoft 365 GCC tenant email service',
        session_id=session_id,
    ))

    # ── Incident 9: Laptop won't join domain (ACTIVE) ────────────────
    inc9_id = _id('inc-2026-0009')
    inc9 = Incident(
        id=inc9_id,
        incident_number='INC-2026-0009',
        title='New laptop won\'t join domain',
        description='New employee laptop cannot join corporate domain, DNS resolution failing.',
        severity='low',
        category='access_issue',
        status='open',
        reported_at='2026-02-12T10:00:00',
        impact_description='New employee unable to access corporate resources',
        users_affected=1,
        business_impact='low',
        data_breach=0,
        reported_by='Help Desk',
        assigned_to='Help Desk',
        created_at='2026-02-12T10:00:00',
        updated_at='2026-02-12T10:00:00',
        session_id=session_id,
    )
    db.session.add(inc9)

    # INC-9 Timeline
    db.session.add(TimelineEntry(
        id=_id('tl-inc9-01'),
        incident_id=inc9_id,
        entry_type='update',
        content='New employee laptop cannot join corporate domain, DNS resolution failing',
        author='Help Desk',
        created_at='2026-02-12T10:00:00',
        session_id=session_id,
    ))

    # ── Communications ───────────────────────────────────────────────
    comms = [
        Communication(
            id=_id('comm-inc1-01'),
            incident_id=inc1_id,
            channel='email',
            recipient='IT Director',
            message='CUI file share outage — all hands investigating. NAS-01 storage at 99% capacity. '
                    'ETA for resolution: 30 minutes.',
            sent_at='2026-01-15T09:20:00',
            sent_by='Sarah Chen',
            session_id=session_id,
        ),
        Communication(
            id=_id('comm-inc1-02'),
            incident_id=inc1_id,
            channel='slack',
            recipient='#it-ops',
            message='File share restored, root cause identified — NAS log rotation not configured. '
                    'Post-incident review scheduled for Friday.',
            sent_at='2026-01-15T10:05:00',
            sent_by='Sarah Chen',
            session_id=session_id,
        ),
        Communication(
            id=_id('comm-inc3-01'),
            incident_id=inc3_id,
            channel='email',
            recipient='Remote Team Lead',
            message='VPN issue identified — firewall session table exhausted. Workaround: '
                    'if VPN drops, reconnect and it should stabilize. Permanent fix in progress.',
            sent_at='2026-01-25T09:00:00',
            sent_by='Mike Torres',
            session_id=session_id,
        ),
        Communication(
            id=_id('comm-inc8-01'),
            incident_id=inc8_id,
            channel='teams',
            recipient='#all-staff',
            message='We are aware of email delays affecting M365 services. '
                    'Microsoft has acknowledged a service degradation in the US East region. '
                    'We are monitoring and will provide updates.',
            sent_at='2026-02-12T09:20:00',
            sent_by='Alex Kim',
            session_id=session_id,
        ),
    ]
    for c in comms:
        db.session.add(c)

    db.session.commit()
    print('Seed data loaded: 9 incidents, 2 problems, 4 SLA targets, '
          '37 timeline entries, 8 assets, 2 responders, 4 communications')
