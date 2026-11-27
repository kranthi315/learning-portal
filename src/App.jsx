import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, Award, BarChart3, Bell, BookOpen, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Cloud, Download, Eye, EyeOff, FileCheck2, FileText, Filter, Globe2, GraduationCap, LayoutDashboard,
  LifeBuoy, LockKeyhole, LogOut, Mail, Menu, MessageSquareText, MoreHorizontal, Play, Plus, Search,
  Settings, ShieldCheck, SlidersHorizontal, Sparkles, Upload, UserCog, UserRound, Users, X, Zap,
} from 'lucide-react';
import { assignments as initialAssignments, courses, lessons, notifications, quizQuestions } from './data.js';
import { authMode, initializeAuth, signInWithMicrosoft, signOutFromMicrosoft } from './services/auth.js';
import { createCertificatePdf } from './services/certificatePdf.js';
import { useDemoState } from './services/demoState.js';

const learningLinks = [['Dashboard', LayoutDashboard], ['My learning', GraduationCap], ['Course catalog', BookOpen]];
const activityLinks = [['Assignments', FileCheck2], ['Assessments', CircleHelp], ['Certifications', Award], ['Notifications', Bell]];
const roleLinks = {
  Instructor: [['Instructor dashboard', BriefcaseBusiness]],
  Administrator: [['Admin dashboard', BarChart3], ['User management', Users], ['Reports & analytics', Activity]],
};
const pageMap = {
  Dashboard: 'dashboard', 'Course catalog': 'catalog', 'My learning': 'learning',
  Assignments: 'assignments', Assessments: 'assessments', Certifications: 'certifications',
  Notifications: 'notifications', 'Instructor dashboard': 'instructor', 'Admin dashboard': 'admin',
  'User management': 'users', 'Reports & analytics': 'reports', 'My Profile': 'profile',
  'Account Settings': 'account-settings', 'Notification Preferences': 'notification-settings',
  'Help and Support': 'help', 'About Learning Hub': 'about',
};
const profileDefaults = {
  displayName: 'Kranthi Thimmayya',
  phone: '+1 (425) 555-0142',
  department: 'Cloud Learning',
  designation: 'Learning Program Participant',
  employeeId: 'DEMO-10482',
  manager: 'Sarah Chen',
};
const preferenceDefaults = {
  emailDeadlines: true,
  emailGrades: true,
  emailCourseUpdates: false,
  productUpdates: false,
  language: 'English (United States)',
  compactMode: false,
};
const fmt = (n) => String(n).padStart(2, '0');

function App() {
  const [authReady, setAuthReady] = useState(authMode === 'demo');
  const [authError, setAuthError] = useState('');
  const [account, setAccount] = useState(() => {
    if (authMode !== 'demo') return null;
    const username = window.sessionStorage.getItem('learning-hub:demo-email')
      || (window.localStorage.getItem('learning-hub:remember-demo') === 'active' ? window.localStorage.getItem('learning-hub:demo-email') : null);
    return username ? { username, name: profileDefaults.displayName } : null;
  });
  const [signedIn, setSignedIn] = useState(() => authMode === 'demo' && (
    window.sessionStorage.getItem('learning-hub:demo-session') === 'active'
    || window.localStorage.getItem('learning-hub:remember-demo') === 'active'
  ));
  const [page, setPage] = useState('dashboard');
  const [role, setRole] = useDemoState('role-preview', 'Student');
  const [profiles, setProfiles] = useDemoState('profiles', {});
  const [preferenceStore, setPreferenceStore] = useDemoState('preferences', {});
  const [courseId, setCourseId] = useState('az900');
  const [enrolledCourseIds, setEnrolledCourseIds] = useDemoState('enrolled-courses', courses.filter((course) => course.enrolled).map((course) => course.id));
  const [lessonIndex, setLessonIndex] = useState(0);
  const [doneLessonsByCourse, setDoneLessonsByCourse] = useDemoState('completed-lessons', { az900: [0, 1, 2, 3] });
  const [courseSearch, setCourseSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [level, setLevel] = useState('All levels');
  const [statusFilter, setStatusFilter] = useState('All courses');
  const [assignmentsList, setAssignmentsList] = useDemoState('assignments', initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [quizAnswers, setQuizAnswers] = useDemoState('assessment-draft', {});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useDemoState('assessment-history', []);
  const [readNotifications, setReadNotifications] = useDemoState('read-notifications', []);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('kranthi@example.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [filterDate, setFilterDate] = useState('Last 30 days');

  const identityKey = account?.username?.toLowerCase() || 'demo';
  const initialProfile = authMode === 'demo'
    ? profileDefaults
    : { ...profileDefaults, displayName: account?.name || '', phone: '', department: '', designation: '', employeeId: '', manager: '' };
  const profile = { ...initialProfile, ...(profiles[identityKey] || {}) };
  const preferences = { ...preferenceDefaults, ...(preferenceStore[identityKey] || {}) };
  const updateProfile = (key, value) => setProfiles((current) => ({
    ...current,
    [identityKey]: { ...initialProfile, ...(current[identityKey] || {}), [key]: value },
  }));
  const updatePreference = (key, value) => setPreferenceStore((current) => ({
    ...current,
    [identityKey]: { ...preferenceDefaults, ...(current[identityKey] || {}), [key]: value },
  }));
  const navGroups = [
    { label: 'LEARN', links: learningLinks },
    { label: 'MY ACTIVITY', links: activityLinks },
    ...(roleLinks[role] ? [{ label: 'MANAGE', links: roleLinks[role] }] : []),
  ];

  useEffect(() => {
    let active = true;
    initializeAuth().then((identity) => {
      if (!active) return;
      if (identity) {
        setAccount(identity);
        const claims = identity.idTokenClaims || {};
        const identityRole = Array.isArray(claims.roles)
          ? claims.roles.find((claim) => ['Student', 'Instructor', 'Administrator'].includes(claim))
          : null;
        setRole(identityRole || 'Student');
        setSignedIn(true);
      }
      setAuthReady(true);
    }).catch((error) => {
      console.error('Unable to initialize Microsoft Entra sign-in.', error);
      if (active) {
        setAuthError('Organizational sign-in could not be initialized. Check the Entra configuration and try again.');
        setAuthReady(true);
      }
    });
    return () => { active = false; };
  }, [setRole]);
  useEffect(() => {
    if (!signedIn) return undefined;
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.global-search input')?.focus();
      }
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [signedIn]);

  const allCourses = useMemo(() => courses.map((course) => ({ ...course, enrolled: enrolledCourseIds.includes(course.id) })), [enrolledCourseIds]);
  const activeCourse = allCourses.find((course) => course.id === courseId) || allCourses[0];
  const doneLessons = doneLessonsByCourse[courseId] || [];
  const assignment = assignmentsList.find((item) => item.id === selectedAssignment) || assignmentsList[0];
  const filteredCourses = useMemo(() => allCourses.filter((course) => {
    const matchesText = `${course.title} ${course.code} ${course.description}`.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesCategory = category === 'All categories' || course.category === category;
    const matchesLevel = level === 'All levels' || course.difficulty === level;
    const matchesStatus = statusFilter === 'All courses' || (statusFilter === 'Enrolled' ? course.enrolled : !course.enrolled);
    return matchesText && matchesCategory && matchesLevel && matchesStatus;
  }), [allCourses, courseSearch, category, level, statusFilter]);
  const completedLessons = doneLessons.filter((index) => index < lessons.length).length;
  const progress = Math.round((completedLessons / lessons.length) * 100);
  const unreadCount = notifications.filter((item) => item.unread && !readNotifications.includes(item.title)).length;
  const alert = (text) => { setToast(text); window.setTimeout(() => setToast(''), 3000); };
  const allowedPage = (nextPage) => {
    if (['admin', 'users', 'reports'].includes(nextPage)) return role === 'Administrator';
    if (nextPage === 'instructor') return role === 'Instructor';
    return true;
  };
  const navigate = (nextPage) => {
    setPage(allowedPage(nextPage) ? nextPage : 'access-denied');
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const changeRole = (nextRole) => {
    if (authMode !== 'demo') return;
    setRole(nextRole);
    if ((['admin', 'users', 'reports'].includes(page) && nextRole !== 'Administrator')
      || (page === 'instructor' && nextRole !== 'Instructor')) setPage('dashboard');
    setProfileMenuOpen(false);
  };
  const completeDemoSignIn = (remember) => {
    const username = loginEmail.trim().toLowerCase();
    window.sessionStorage.setItem('learning-hub:demo-session', 'active');
    window.sessionStorage.setItem('learning-hub:demo-email', username);
    if (remember) {
      window.localStorage.setItem('learning-hub:remember-demo', 'active');
      window.localStorage.setItem('learning-hub:demo-email', username);
    } else {
      window.localStorage.removeItem('learning-hub:remember-demo');
      window.localStorage.removeItem('learning-hub:demo-email');
    }
    setAccount({ username, name: profileDefaults.displayName });
    setRole('Student');
    setSignedIn(true);
    navigate('dashboard');
  };
  const handleEntraSignIn = async () => {
    setAuthError('');
    try {
      await signInWithMicrosoft();
    } catch (error) {
      console.error('Microsoft Entra sign-in failed.', error);
      setAuthError('Microsoft sign-in could not be started. Please try again or contact your administrator.');
    }
  };
  const handleSignOut = async () => {
    setLogoutConfirm(false);
    if (authMode === 'entra') {
      try {
        await signOutFromMicrosoft();
      } catch (error) {
        console.error('Microsoft Entra sign-out failed.', error);
        setAuthError('Sign-out could not be completed. Please try again.');
        alert('Sign-out could not be completed.');
      }
      return;
    }
    window.sessionStorage.removeItem('learning-hub:demo-session');
    window.sessionStorage.removeItem('learning-hub:demo-email');
    window.localStorage.removeItem('learning-hub:remember-demo');
    window.localStorage.removeItem('learning-hub:demo-email');
    setAccount(null);
    setSignedIn(false);
    setPage('dashboard');
  };
  const openCourse = (id) => { setCourseId(id); setLessonIndex(0); navigate('course'); };
  const enrollCourse = (id) => {
    setEnrolledCourseIds((current) => current.includes(id) ? current : [...current, id]);
    alert(`Enrolled in ${courses.find((course) => course.id === id)?.title || 'course'}`);
  };
  const markLesson = () => {
    setDoneLessonsByCourse((current) => {
      const currentCourseLessons = current[courseId] || [];
      return currentCourseLessons.includes(lessonIndex) ? current : { ...current, [courseId]: [...currentCourseLessons, lessonIndex] };
    });
    alert('Lesson marked as complete');
  };
  const downloadCertificate = (courseTitle = 'Azure AI Fundamentals') => {
    const blob = createCertificatePdf(courseTitle);
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'sample-certificate.pdf';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const submitAssignment = (event) => {
    event.preventDefault();
    if (!selectedFile) return alert('Choose a file before submitting.');
    if (selectedFile.size > 25 * 1024 * 1024) return alert('Files must be 25 MB or smaller.');
    setAssignmentsList((current) => current.map((item) => item.id === assignment.id ? { ...item, status: 'Submitted', submissionComment: comment, submittedFileName: selectedFile.name } : item));
    alert(`${assignment.title} submitted successfully`);
    navigate('assignments');
    setSelectedFile(null);
  };
  const submitQuiz = () => {
    if (quizSubmitted) return;
    const result = {
      id: `${Date.now()}`,
      score: Math.round(score / quizQuestions.length * 100),
      completedAt: new Date().toISOString(),
    };
    setAssessmentHistory((current) => [result, ...current]);
    setQuizSubmitted(true);
    navigate('results');
  };
  const saveQuiz = () => { alert('Your progress has been saved. You can continue later.'); navigate('assessments'); };
  const score = quizQuestions.reduce((total, question, index) => {
    const selected = quizAnswers[index];
    if (question.type === 'multi') return total + (JSON.stringify([...(selected || [])].sort()) === JSON.stringify([...question.answer].sort()) ? 1 : 0);
    return total + (selected === question.answer ? 1 : 0);
  }, 0);

  if (!authReady) return <div className="auth-loading" role="status">Connecting to your sign-in provider…</div>;
  if (!signedIn) return <Login
    email={loginEmail}
    setEmail={setLoginEmail}
    password={loginPassword}
    setPassword={setLoginPassword}
    mode={authMode}
    error={authError}
    onLogin={completeDemoSignIn}
    onEntraSignIn={handleEntraSignIn}
    onReset={() => alert(`If an account exists for ${loginEmail || 'that address'}, password reset instructions will be sent.`)}
    toast={toast}
  />;

  return (
    <div className={`app-shell ${preferences.compactMode ? 'compact-mode' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand" aria-label="Microsoft Learning Hub"><div className="brand-mark"><BookOpen size={19} /></div><div><strong>Microsoft Learning Hub</strong><small>DEMO ENVIRONMENT</small></div><button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-caption">{group.label}</div>
            {group.links.map(([label, Icon]) => <button key={label} className={`nav-item ${page === pageMap[label] ? 'active' : ''}`} onClick={() => navigate(pageMap[label])}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Notifications' && unreadCount > 0 && <i className="nav-dot" />}</button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><Sparkles size={17} /></div><strong>Keep growing</strong><p>Your next skill is one lesson away.</p><button onClick={() => navigate('catalog')}>Explore courses <ArrowRight size={14} /></button></div>
          <button className="profile-mini profile-mini-button" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} aria-label="Open profile and account menu"><div className="avatar">{profile.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="profile-info"><strong>{profile.displayName}</strong><small>{role}{authMode === 'demo' ? ' · Demo account' : ' · Organizational account'}</small></div><MoreHorizontal size={19} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Learning Hub</span><ChevronRight size={14} /><strong>{pageTitle(page)}</strong></div>
          <div className="topbar-actions"><label className="global-search"><Search size={16} /><input aria-label="Search courses" placeholder="Search anything..." value={globalSearch} onChange={(event) => { setGlobalSearch(event.target.value); setCourseSearch(event.target.value); if (event.target.value) navigate('catalog'); }} /><kbd>Ctrl K</kbd></label><button className="icon-btn notification-btn" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => navigate('notifications')}><Bell size={19} />{unreadCount > 0 && <i />}</button><button className="top-avatar top-avatar-button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open account menu">{profile.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</button></div>
        </header>
        <div className="page-content">{renderPage()}</div>
        <footer className="app-footer"><span>Microsoft Learning Hub <b>·</b> Demo prototype</span><span>Not an official Microsoft product</span></footer>
      </main>
      {profileMenuOpen && <>
        <button className="menu-dismiss" onClick={() => setProfileMenuOpen(false)} aria-label="Close account menu" />
        <section className="account-menu" aria-label="Profile and account menu">
          <div className="account-menu-header"><div className="avatar">{profile.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div><b>{profile.displayName}</b><span>{account?.username || 'Demo learner account'}</span><small>{role} · {authMode === 'demo' ? 'Demo' : 'Entra ID'}</small></div></div>
          <div className="account-menu-items">
            {['My Profile', 'Account Settings', 'Notification Preferences', 'Help and Support', 'About Learning Hub'].map((label, index) => {
              const Icon = [UserRound, Settings, Bell, LifeBuoy, CircleHelp][index];
              return <button key={label} onClick={() => navigate(pageMap[label])}><Icon size={16} />{label}</button>;
            })}
          </div>
          {authMode === 'demo' && <div className="role-switcher"><label htmlFor="role-preview">Demo role preview</label><select id="role-preview" value={role} onChange={(event) => changeRole(event.target.value)}><option>Student</option><option>Instructor</option><option>Administrator</option></select><small>Role previews are local UI demos, not authorization.</small></div>}
          <button className="account-signout" onClick={() => { setProfileMenuOpen(false); setLogoutConfirm(true); }}><LogOut size={16} /> Sign out</button>
        </section>
      </>}
      {logoutConfirm && <div className="modal-backdrop" role="presentation"><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="modal-icon"><LogOut size={19} /></div><h2 id="logout-title">Sign out of Learning Hub?</h2><p>{authMode === 'demo' ? 'Your demo progress is saved in this browser. You can sign back in to continue.' : 'You will be redirected to your organizational sign-in provider.'}</p><div className="modal-actions"><Button variant="secondary" onClick={() => setLogoutConfirm(false)}>Cancel</Button><Button onClick={handleSignOut}>Sign out</Button></div></section></div>}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}<button onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} onCourse={openCourse} role={role} displayName={profile.displayName} />;
      case 'catalog': return <Catalog courses={filteredCourses} search={courseSearch} setSearch={setCourseSearch} category={category} setCategory={setCategory} level={level} setLevel={setLevel} status={statusFilter} setStatus={setStatusFilter} onCourse={openCourse} alert={alert} onEnroll={enrollCourse} />;
      case 'course': return <CoursePage course={activeCourse} progress={progress} lessonsDone={doneLessons} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} onMark={markLesson} onEnroll={() => enrollCourse(activeCourse.id)} onBack={() => navigate('catalog')} />;
      case 'learning': return <MyLearning courses={allCourses} onCourse={openCourse} />;
      case 'assignments': return <Assignments assignments={assignmentsList} onOpen={(id) => { setSelectedAssignment(id); navigate('submission'); }} />;
      case 'submission': return <Submission assignment={assignment} selectedFile={selectedFile} setFile={setSelectedFile} comment={comment} setComment={setComment} onBack={() => navigate('assignments')} onSubmit={submitAssignment} alert={alert} />;
      case 'assessments': return <Assessments history={assessmentHistory} onStart={() => { if (quizSubmitted) setQuizAnswers({}); setQuizSubmitted(false); navigate('quiz'); }} />;
      case 'quiz': return <Quiz answers={quizAnswers} setAnswers={setQuizAnswers} onSubmit={submitQuiz} onSave={saveQuiz} />;
      case 'results': return <Results score={score} answers={quizAnswers} completedAt={assessmentHistory[0]?.completedAt} onRetry={() => navigate('assessments')} />;
      case 'certifications': return <Certifications courses={allCourses} onDownload={downloadCertificate} onCourse={openCourse} />;
      case 'notifications': return <Notifications
        readIds={readNotifications}
        filter={notificationFilter}
        setFilter={setNotificationFilter}
        onReadAll={() => setReadNotifications(notifications.map((item) => item.title))}
        onRead={(title) => setReadNotifications((current) => current.includes(title) ? current : [...current, title])}
        onSettings={() => navigate('notification-settings')}
      />;
      case 'profile': return <ProfilePage profile={profile} account={account} mode={authMode} onChange={updateProfile} onSave={() => alert('Profile changes saved in this browser.')} />;
      case 'account-settings': return <AccountSettings account={account} role={role} mode={authMode} onSignOut={() => setLogoutConfirm(true)} />;
      case 'notification-settings': return <NotificationSettings preferences={preferences} onChange={updatePreference} />;
      case 'help': return <HelpPage />;
      case 'about': return <AboutPage />;
      case 'access-denied': return <AccessDenied onBack={() => navigate('dashboard')} />;
      case 'instructor': return <Instructor alert={alert} />;
      case 'admin': return <><Admin onNavigate={navigate} /><BackgroundJobs alert={alert} /></>;
      case 'users': return <UsersPage alert={alert} />;
      case 'reports': return <Reports date={filterDate} setDate={setFilterDate} />;
      default: return <Dashboard onNavigate={navigate} onCourse={openCourse} role={role} displayName={profile.displayName} />;
    }
  }
}

function pageTitle(page) {
  return ({
    dashboard: 'Dashboard', catalog: 'Course catalog', course: 'Course details', learning: 'My learning',
    assignments: 'Assignment center', submission: 'Assignment submission', assessments: 'Assessments',
    quiz: 'Assessment in progress', results: 'Assessment results', certifications: 'My certifications',
    notifications: 'Notifications', instructor: 'Instructor dashboard', admin: 'Admin dashboard',
    users: 'User management', reports: 'Reports & analytics', profile: 'My Profile',
    'account-settings': 'Account Settings', 'notification-settings': 'Notification Preferences',
    help: 'Help and Support', about: 'About Learning Hub', 'access-denied': 'Access unavailable',
  })[page] || 'Dashboard';
}

function DeprecatedLogin({ email, setEmail, password, setPassword, onLogin, alert, toast }) {
  return <div className="login-screen"><div className="login-left"><div className="login-brand"><span className="brand-mark"><BookOpen size={19} /></span><span>Learning Hub</span><small>DEMO</small></div><div className="login-hero"><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Make learning<br />your <span>superpower.</span></h1><p>Build skills for tomorrow with learning experiences designed around you.</p><div className="login-illustration"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="illustration-card"><div className="ill-icon"><Cloud size={28} /></div><div><b>Azure Fundamentals</b><small>Learning path · 68% complete</small></div><div className="ill-progress"><span /></div></div><div className="float-chip chip-a"><Award size={17} /> New certification</div><div className="float-chip chip-b"><Zap size={16} /> 3 day streak</div></div></div><div className="login-left-footer">A prototype experience · Not an official Microsoft product</div></div><div className="login-right"><form className="login-form" onSubmit={(event) => { event.preventDefault(); onLogin(); }}><div className="form-kicker">WELCOME BACK</div><h2>Sign in to your account</h2><p className="login-subtitle">Pick up where you left off on your learning journey.</p><label className="field-label">Email address</label><div className="input-wrap"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div><label className="field-label password-label">Password <button type="button" className="text-button" onClick={() => alert('Password reset is simulated in this demo.')}>Forgot password?</button></label><div className="input-wrap"><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div><label className="remember"><input type="checkbox" defaultChecked /> <span>Remember me</span></label><button className="button button-primary login-submit" type="submit">Sign in <ArrowRight size={17} /></button><div className="divider"><span>or continue with</span></div><button type="button" className="button org-button" onClick={() => { onLogin(); }}><span className="entra-mark"><span /><span /><span /><span /></span> Sign in with organizational account</button><div className="demo-note"><ShieldCheck size={16} /><span>Demo sign-in — any email and password will work.</span></div><div className="login-terms">By signing in, you agree to our <a href="#terms" onClick={(event) => event.preventDefault()}>Terms</a> and <a href="#privacy" onClick={(event) => event.preventDefault()}>Privacy statement</a>.</div></form><div className="login-copyright">© 2026 Learning Hub Demo <span>·</span> Privacy <span>·</span> Help</div></div>{toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}</div>;
}

function Login({ email, setEmail, password, setPassword, mode, error, onLogin, onEntraSignIn, onReset, toast }) {
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [remember, setRemember] = useState(true);
  const isEntra = mode === 'entra';
  const handleSubmit = (event) => {
    event.preventDefault();
    if (isEntra) onEntraSignIn();
    else if (resetMode) {
      onReset();
      setResetMode(false);
    }     else onLogin(remember);
  };
  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="login-brand"><span className="brand-mark"><BookOpen size={19} /></span><span>Learning Hub</span><small>{isEntra ? 'ORGANIZATIONAL SIGN-IN' : 'DEMO'}</small></div>
        <div className="login-hero">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div>
          <h1>Make learning<br />your <span>superpower.</span></h1>
          <p>Build skills for tomorrow with learning experiences designed around you.</p>
          <div className="login-illustration"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="illustration-card"><div className="ill-icon"><Cloud size={28} /></div><div><b>Azure Fundamentals</b><small>Learning path · 68% complete</small></div><div className="ill-progress"><span /></div></div><div className="float-chip chip-a"><Award size={17} /> New certification</div><div className="float-chip chip-b"><Zap size={16} /> 3 day streak</div></div>
        </div>
        <div className="login-left-footer">A prototype experience · Not an official Microsoft product</div>
      </div>
      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-kicker">{isEntra ? 'ORGANIZATIONAL ACCESS' : resetMode ? 'ACCOUNT RECOVERY' : 'WELCOME TO MICROSOFT LEARNING HUB'}</div>
          <h2>{isEntra ? 'Sign in with your organization' : resetMode ? 'Reset your password' : 'Welcome back'}</h2>
          <p className="login-subtitle">{isEntra ? 'Use your organization’s Microsoft Entra ID account to continue.' : resetMode ? 'Enter your email and we’ll show the demo recovery confirmation.' : 'Pick up where you left off on your learning journey.'}</p>
          {!isEntra && <label className="field-label" htmlFor="login-email">Email address</label>}
          {!isEntra && <div className="input-wrap"><Mail size={17} /><input id="login-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>}
          {!isEntra && !resetMode && <>
            <label className="field-label password-label" htmlFor="login-password">Password <button type="button" className="text-button" onClick={() => setResetMode(true)}>Forgot password?</button></label>
            <div className="input-wrap"><LockKeyhole size={17} /><input id="login-password" required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Remember me on this device</span></label>
          </>}
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="button button-primary login-submit" type="submit">{isEntra ? 'Continue with Microsoft' : resetMode ? 'Send reset instructions' : 'Sign in'} <ArrowRight size={17} /></button>
          {resetMode && <button className="text-button reset-back" type="button" onClick={() => setResetMode(false)}>Back to sign in</button>}
          {!isEntra && <><div className="divider"><span>or</span></div><button type="button" className="button org-button" onClick={onEntraSignIn} disabled title="Set VITE_ENTRA_CLIENT_ID to enable organizational sign-in"><span className="entra-mark"><span /><span /><span /><span /></span> Sign in with organizational account</button></>}
          <div className="demo-note"><ShieldCheck size={16} /><span>{isEntra ? 'Sign-in is configured for this deployment. Organizational accounts are handled by Microsoft Entra ID.' : 'Demo sign-in — any email address and password will work. No credentials are sent to a service.'}</span></div>
          <div className="login-terms">By signing in, you agree to our <a href="#terms" onClick={(event) => event.preventDefault()}>Terms</a> and <a href="#privacy" onClick={(event) => event.preventDefault()}>Privacy statement</a>.</div>
        </form>
        <div className="login-copyright">© 2026 Learning Hub Demo <span>·</span> Privacy <span>·</span> Help</div>
      </div>
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
function Button({ children, variant = 'primary', onClick, icon: Icon, className = '', ...props }) { return <button className={`button button-${variant} ${className}`} onClick={onClick} {...props}>{Icon && <Icon size={16} />}{children}</button>; }
function ProgressBar({ value, color = 'blue' }) { return <div className={`progress-track ${color}`}><span style={{ width: `${value}%` }} /></div>; }
function StatCard({ icon: Icon, label, value, trend, color = 'blue', footnote }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong>{trend && <small className="stat-trend"><span>↗ {trend}</span> vs last month</small>}{footnote && <small className="stat-footnote">{footnote}</small>}</div></div>;
}
function CourseArt({ course, large = false }) { return <div className={`course-art art-${course.color} ${large ? 'art-large' : ''}`}><span className="art-shape shape-one" /><span className="art-shape shape-two" /><span className="art-code">{course.code}</span><span className="art-icon">{course.icon}</span><span className="art-tag">MICROSOFT LEARN</span></div>; }
function CourseCard({ course, onCourse, alert }) {
  return <article className="course-card"><CourseArt course={course} /><div className="course-card-body"><div className="course-meta"><span className="tag">{course.category}</span><span className="difficulty">{course.difficulty}</span></div><h3>{course.title}</h3><div className="course-code">{course.code}</div><p>{course.description}</p><div className="course-details"><span><Clock3 size={14} />{course.duration}</span><span><Users size={14} />{course.instructor}</span></div>{course.enrolled ? <div className="course-progress"><div><span>Your progress</span><b>{course.progress}%</b></div><ProgressBar value={course.progress} /></div> : <div className="course-progress course-open"><span>Ready when you are</span></div>}<div className="course-card-actions">{course.enrolled ? <Button variant="secondary" onClick={() => onCourse(course.id)}>Continue learning <ArrowRight size={15} /></Button> : <Button onClick={() => { onCourse(course.id); alert(`Previewing ${course.title}`); }}>View course <ArrowRight size={15} /></Button>}</div></div></article>;
}

function Dashboard({ onNavigate, onCourse, role, displayName }) {
  const enrolled = courses.filter((course) => course.enrolled && course.progress > 0);
  const firstName = displayName.split(' ')[0] || 'Learner';
  return <><PageHeader eyebrow={`${role.toUpperCase()} WORKSPACE · THURSDAY, NOVEMBER 26`} title={`Good morning, ${firstName}!`} description="Ready to make today a little more knowledgeable?" action={<Button variant="secondary" icon={CalendarDays} onClick={() => onNavigate('assignments')}>View my schedule</Button>} />
    {role !== 'Student' && <div className="role-banner"><Sparkles size={17} /><span><b>{role} preview</b> — You’re viewing role-specific tools in demo mode.</span></div>}
    <div className="stats-grid dashboard-stats"><StatCard icon={BookOpen} label="Enrolled courses" value="4" trend="2" /><StatCard icon={Play} label="In progress" value="2" color="purple" trend="12%" /><StatCard icon={CheckCircle2} label="Completed" value="1" color="green" footnote="Keep the momentum going" /><StatCard icon={FileText} label="Pending assignments" value="2" color="orange" footnote="Next due Nov 28" /><StatCard icon={CalendarDays} label="Upcoming assessments" value="1" color="purple" footnote="Next Nov 27" /><StatCard icon={Award} label="Certifications earned" value="1" color="green" footnote="Azure AI Fundamentals" /></div>
    <div className="dashboard-grid"><section className="panel progress-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR JOURNEY</div><h2>My learning progress</h2></div><button className="link-button" onClick={() => onNavigate('learning')}>View all <ArrowRight size={15} /></button></div><div className="journey-progress"><div className="progress-ring"><div><b>42%</b><small>overall</small></div></div><div className="journey-copy"><strong>You're building great habits.</strong><p>You've completed <b>1 of 4</b> courses. Keep it up!</p><div className="mini-legend"><span><i className="legend-blue" /> In progress <b>2</b></span><span><i className="legend-green" /> Completed <b>1</b></span><span><i className="legend-grey" /> Not started <b>1</b></span></div></div></div><div className="course-progress-list">{enrolled.slice(0, 3).map((course) => <div className="progress-course-row" key={course.id}><div className={`tiny-course-icon art-${course.color}`}>{course.icon}</div><div className="progress-course-info"><div><b>{course.title}</b><span>{course.progress}%</span></div><ProgressBar value={course.progress} /></div><button className="icon-btn" onClick={() => onCourse(course.id)} aria-label={`Continue ${course.title}`}><ArrowRight size={16} /></button></div>)}</div></section>
      <section className="panel deadline-panel"><div className="panel-heading"><div><div className="eyebrow">STAY ON TRACK</div><h2>Upcoming deadlines</h2></div><button className="icon-btn" onClick={() => onNavigate('assignments')} aria-label="More deadlines"><MoreHorizontal size={19} /></button></div><div className="deadline-highlight"><div className="deadline-date"><b>28</b><span>NOV</span></div><div><span className="deadline-type">ASSIGNMENT</span><h3>Cloud architecture diagram</h3><p>Azure Fundamentals · Due in 2 days</p></div></div><div className="deadline-item"><div className="deadline-bullet purple-bullet" /><div><b>Azure Fundamentals assessment</b><span>Nov 27 · 10:00 AM</span></div><span className="due-pill">Tomorrow</span></div><div className="deadline-item"><div className="deadline-bullet green-bullet" /><div><b>Identity & access review</b><span>Azure Administrator · Nov 30</span></div></div><button className="deadline-footer" onClick={() => onNavigate('assignments')}>See all deadlines <ArrowRight size={14} /></button></section>
      <section className="panel recommended-panel"><div className="panel-heading"><div><div className="eyebrow">PICKED FOR YOU</div><h2>Recommended courses</h2></div><button className="link-button" onClick={() => onNavigate('catalog')}>Explore catalog <ArrowRight size={15} /></button></div><div className="recommended-grid">{courses.filter((course) => !course.enrolled).slice(0, 2).map((course) => <div className="recommend-card" key={course.id}><CourseArt course={course} /><div className="recommend-copy"><span className="tag">{course.category}</span><h3>{course.title}</h3><p>{course.duration} · {course.difficulty}</p><button onClick={() => onCourse(course.id)}>Explore course <ArrowRight size={14} /></button></div></div>)}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">THE LATEST</div><h2>Recent activity</h2></div><button className="icon-btn" aria-label="More activity"><MoreHorizontal size={19} /></button></div><div className="activity-list"><ActivityRow icon={CheckCircle2} color="green" title="Lesson completed" text="Cloud deployment models · Azure Fundamentals" time="Today, 9:42 AM" /><ActivityRow icon={FileCheck2} color="blue" title="Assignment submitted" text="AI responsible use reflection" time="Yesterday" /><ActivityRow icon={Award} color="orange" title="Certification earned" text="Azure AI Fundamentals" time="Nov 18" /></div></section></div>
  </>;
}
function ActivityRow({ icon: Icon, color, title, text, time }) { return <div className="activity-row"><div className={`activity-icon ${color}`}><Icon size={16} /></div><div><b>{title}</b><p>{text}</p></div><time>{time}</time></div>; }

function Catalog({ courses: visibleCourses, search, setSearch, category, setCategory, level, setLevel, status, setStatus, onCourse, alert }) {
  return <><PageHeader eyebrow="EXPLORE & GROW" title="Course catalog" description="Find your next skill, explore a new path, and learn at your own pace." action={<div className="catalog-count"><strong>{visibleCourses.length}</strong><span>courses available</span></div>} /><div className="catalog-toolbar"><label className="catalog-search"><Search size={17} /><input placeholder="Search courses or certification..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><div className="filter-select"><Filter size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option><option>Cloud</option><option>Security</option><option>AI & data</option><option>Architecture</option><option>Networking</option><option>DevOps</option></select><ChevronDown size={14} /></div><select className="select-simple" value={level} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><select className="select-simple" value={status} onChange={(event) => setStatus(event.target.value)}><option>All courses</option><option>Enrolled</option><option>Not enrolled</option></select></div><div className="catalog-section-heading"><div><span className="eyebrow">LEARN SOMETHING NEW</span><h2>Explore all courses <span>{visibleCourses.length}</span></h2></div><button className="link-button" onClick={() => { setSearch(''); setCategory('All categories'); setLevel('All levels'); setStatus('All courses'); }}>Clear filters <X size={14} /></button></div>{visibleCourses.length ? <div className="catalog-grid">{visibleCourses.map((course) => <CourseCard key={course.id} course={course} onCourse={onCourse} alert={alert} />)}</div> : <div className="empty-state"><Search size={28} /><h3>No courses found</h3><p>Try a different search or update your filters.</p></div>}</>;
}

function CoursePage({ course, progress, lessonsDone, lessonIndex, setLessonIndex, onMark, onEnroll, onBack }) {
  const lesson = lessons[lessonIndex] || lessons[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const modules = [
    { title: 'Module 1 · Cloud concepts', lessons: lessons.slice(0, 3), startIndex: 0 },
    { title: 'Module 2 · Azure architecture and services', lessons: lessons.slice(3, 5), startIndex: 3 },
    { title: 'Module 3 · Security, privacy, and pricing', lessons: lessons.slice(5), startIndex: 5 },
  ];

  return (
    <>
      <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Course catalog</button>
      <div className="course-hero">
        <CourseArt course={course} large />
        <div className="course-hero-copy">
          <div className="course-meta"><span className="tag">{course.category}</span><span className="difficulty">{course.difficulty}</span><span className="code-pill">{course.code}</span></div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="hero-instructor"><div className="avatar avatar-small">{course.instructor.split(' ').map((part) => part[0]).join('')}</div><span>Created by <b>{course.instructor}</b></span><span className="hero-dot">·</span><span><Clock3 size={14} /> {course.duration}</span></div>
          <div className="hero-actions">
            <Button icon={course.enrolled ? Play : Plus} onClick={() => course.enrolled ? setActiveTab('Curriculum') : onEnroll()}>{course.enrolled ? 'Continue learning' : 'Enroll in course'}</Button>
            <Button variant="secondary" icon={Download} onClick={() => window.alert('Course guide download is simulated in this demo.')}>Download course guide</Button>
          </div>
        </div>
      </div>
      <div className="course-stats-strip">
        <div><b>{course.duration}</b><span>Total learning time</span></div>
        <div><b>6 lessons</b><span>Across 3 modules</span></div>
        <div><b>{course.difficulty}</b><span>Skill level</span></div>
        <div><b>Certificate</b><span>Upon completion</span></div>
        <div className="hero-progress"><span>Your progress <b>{course.enrolled ? progress : course.progress}%</b></span><ProgressBar value={course.enrolled ? progress : course.progress} /></div>
      </div>
      <div className="tabs course-tabs">
        {['Overview', 'Curriculum', 'Resources'].map((tab) => <button key={tab} className={activeTab === tab ? 'selected' : ''} onClick={() => setActiveTab(tab)}>{tab}{tab === 'Curriculum' && <span className="tab-count">6</span>}</button>)}
      </div>
      <div className="course-detail-layout">
        <section className="course-main-content">
          {activeTab === 'Overview' && (
            <>
              <div className="panel course-overview">
                <div className="eyebrow">ABOUT THIS COURSE</div>
                <h2>Build your skills with confidence</h2>
                <p>{course.description} This guided learning experience combines practical exercises, expert instruction, and knowledge checks to help you apply what you learn.</p>
                <h3>What you'll learn</h3>
                <div className="objective-grid">
                  <span><Check size={16} /> Explain core cloud concepts and benefits</span>
                  <span><Check size={16} /> Describe Azure services and architecture</span>
                  <span><Check size={16} /> Understand security, privacy, and compliance</span>
                  <span><Check size={16} /> Identify pricing and support options</span>
                </div>
              </div>
              <div className="panel preview-panel">
                <div className="panel-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Continue learning</h2></div><span className="lesson-counter">Lesson {lessonIndex + 1} of {lessons.length}</span></div>
                <LessonPlayer lesson={lesson} index={lessonIndex} />
                <LessonControls lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} done={lessonsDone.includes(lessonIndex)} onMark={onMark} />
              </div>
            </>
          )}
          {activeTab === 'Curriculum' && (
            <div className="panel curriculum-panel">
              <div className="panel-heading"><div><div className="eyebrow">COURSE CONTENT</div><h2>Course curriculum</h2></div><span className="lesson-counter">{lessonsDone.length} of 6 completed</span></div>
              {modules.map((module) => (
                <div className="curriculum-module" key={module.title}>
                  <div className="module-title"><b>{module.title}</b><span>{module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}</span></div>
                  {module.lessons.map((item, index) => {
                    const realIndex = module.startIndex + index;
                    return <button className="lesson-row" key={item.title} onClick={() => { setLessonIndex(realIndex); setActiveTab('Overview'); }}>
                      <span className={`lesson-status ${lessonsDone.includes(realIndex) ? 'is-done' : ''}`}>{lessonsDone.includes(realIndex) ? <Check size={14} /> : item.type === 'video' ? <Play size={13} /> : <FileText size={13} />}</span>
                      <span>{item.title}<small>{item.duration}</small></span><ArrowRight size={15} />
                    </button>;
                  })}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'Resources' && (
            <div className="panel resource-panel">
              <div className="eyebrow">DOWNLOADABLE MATERIALS</div><h2>Course resources</h2>
              <ResourceRow icon={FileText} title="Azure Fundamentals course guide" info="PDF · 2.4 MB" />
              <ResourceRow icon={FileText} title="Cloud concepts reference sheet" info="PDF · 840 KB" />
              <ResourceRow icon={Download} title="Practice exercises" info="ZIP · 1.2 MB" />
            </div>
          )}
        </section>
        <aside className="course-sidebar">
          <div className="panel instructor-panel">
            <div className="eyebrow">YOUR INSTRUCTOR</div>
            <div className="instructor-card"><div className="instructor-avatar">{course.instructor.split(' ').map((part) => part[0]).join('')}</div><div><b>{course.instructor}</b><span>Cloud solutions architect</span></div></div>
            <p>Helping learners build real-world skills through clear, practical lessons.</p>
            <button className="link-button"><MessageSquareText size={14} /> Ask a question</button>
          </div>
          <div className="panel course-progress-side">
            <div className="eyebrow">YOUR PROGRESS</div>
            <div className="side-progress-number">{course.enrolled ? progress : course.progress}<small>%</small></div>
            <ProgressBar value={course.enrolled ? progress : course.progress} />
            <p>{lessonsDone.length} of 6 lessons completed</p>
            <div className="certificate-side"><Award size={18} /><span>Earn a certificate<br /><small>Complete all lessons</small></span><LockKeyhole size={15} /></div>
          </div>
        </aside>
      </div>
    </>
  );
}
function LessonPlayer({ lesson, index }) { return <div className={`lesson-player player-${lesson.type}`}><div className="player-glow" /><div className="player-center">{lesson.type === 'video' ? <button className="play-large" aria-label="Play lesson"><Play size={25} fill="currentColor" /></button> : lesson.type === 'document' ? <FileText size={47} /> : <CircleHelp size={47} />}<span>{lesson.type === 'video' ? 'Video lesson' : lesson.type === 'document' ? 'Learning resource' : 'Knowledge check'}</span></div><div className="player-label">LESSON {fmt(index + 1)} <span>·</span> {lesson.duration.toUpperCase()}</div><div className="player-controls"><span><Play size={13} /> 00:00</span><div className="player-seek"><span /></div><span>04:32</span><span>⚙</span><span>⛶</span></div></div>; }
function LessonControls({ lessonIndex, setLessonIndex, done, onMark }) { return <div className="lesson-controls"><button className="button button-ghost" onClick={() => setLessonIndex(Math.max(0, lessonIndex - 1))} disabled={lessonIndex === 0}><ChevronLeft size={16} /> Previous lesson</button><div>{done ? <span className="completed-label"><CheckCircle2 size={16} /> Completed</span> : <Button variant="secondary" onClick={onMark}>Mark as complete <Check size={15} /></Button>}<button className="button button-primary" onClick={() => setLessonIndex(Math.min(lessons.length - 1, lessonIndex + 1))} disabled={lessonIndex === lessons.length - 1}>Next lesson <ChevronRight size={16} /></button></div></div>; }
function ResourceRow({ icon: Icon, title, info }) { return <div className="resource-row"><div className="resource-icon"><Icon size={19} /></div><div><b>{title}</b><span>{info}</span></div><button className="icon-btn" aria-label={`Download ${title}`}><Download size={17} /></button></div>; }

function MyLearning({ courses: courseList, onCourse }) {
  const [filter, setFilter] = useState('All courses');
  const myCourses = courseList.filter((course) => course.enrolled);
  const inProgressCount = myCourses.filter((course) => course.progress > 0 && course.progress < 100).length;
  const completedCount = myCourses.filter((course) => course.progress === 100).length;
  const notStartedCount = myCourses.filter((course) => course.progress === 0).length;
  const visibleCourses = myCourses.filter((course) => filter === 'All courses' || (filter === 'In progress' ? course.progress > 0 && course.progress < 100 : filter === 'Completed' ? course.progress === 100 : course.progress === 0));
  return (
    <>
      <PageHeader eyebrow="YOUR LEARNING SPACE" title="My learning" description="All your learning paths, progress, and next steps in one place." action={<Button icon={Plus} onClick={() => onCourse('az900')}>Find a course</Button>} />
      <div className="learning-summary"><div><b>{myCourses.length}</b><span>Enrolled</span></div><div><b>{inProgressCount}</b><span>In progress</span></div><div><b>{completedCount}</b><span>Completed</span></div><div><b>{notStartedCount}</b><span>Not started</span></div><div className="learning-summary-tip"><Sparkles size={19} /><span><b>You're on a roll!</b><small>3 day learning streak</small></span></div></div>
      <div className="tabs learning-tabs">{['All courses', 'In progress', 'Completed', 'Not started'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {visibleCourses.length ? (
        <div className="learning-list">{visibleCourses.map((course) => (
          <article className="learning-row" key={course.id}>
            <CourseArt course={course} />
            <div className="learning-row-main"><div className="course-meta"><span className="tag">{course.category}</span><span className="difficulty">{course.difficulty}</span></div><h3>{course.title}</h3><p>{course.instructor} <span>·</span> {course.duration}</p><div className="learning-row-progress"><ProgressBar value={course.progress} /><span>{course.progress}%</span></div></div>
            <div className={`status-pill status-${course.progress === 100 ? 'completed' : course.progress === 0 ? 'notstarted' : 'progress'}`}><i />{course.progress === 100 ? 'Completed' : course.progress === 0 ? 'Not started' : 'In progress'}</div>
            <Button variant="secondary" onClick={() => onCourse(course.id)}>{course.progress ? 'Continue' : 'Start course'} <ArrowRight size={15} /></Button>
          </article>
        ))}</div>
      ) : <div className="empty-state"><BookOpen size={27} /><h3>No courses in this view</h3><p>Choose another filter to see your courses.</p></div>}
    </>
  );
}

function Assignments({ assignments: items, onOpen }) {
  const [filter, setFilter] = useState('All assignments');
  const [showHistory, setShowHistory] = useState(false);
  const sourceItems = showHistory ? items.filter((item) => ['Submitted', 'Under Review', 'Graded', 'Rejected'].includes(item.status)) : items;
  const visible = sourceItems.filter((item) => filter === 'All assignments' || item.status === filter);
  return (
    <>
      <PageHeader eyebrow={showHistory ? 'SUBMISSION HISTORY' : 'YOUR WORKSPACE'} title={showHistory ? 'Assignment history' : 'Assignment center'} description="Keep track of your coursework, submission status, and upcoming deadlines." action={<Button variant="secondary" icon={Clock3} onClick={() => { setShowHistory((current) => !current); setFilter('All assignments'); }}>{showHistory ? 'Back to assignments' : 'Assignment history'}</Button>} />
      {!showHistory && <div className="stats-grid assignment-stats"><StatCard icon={FileText} label="Total assignments" value={String(items.length)} /><StatCard icon={Clock3} label="Due soon" value="2" color="orange" /><StatCard icon={CheckCircle2} label="Submitted" value={String(items.filter((item) => item.status === 'Submitted').length)} color="green" /><StatCard icon={Award} label="Graded" value={String(items.filter((item) => item.status === 'Graded').length)} color="purple" /></div>}
      <div className="panel assignments-panel">
        <div className="panel-heading"><div><div className="eyebrow">COURSEWORK</div><h2>{showHistory ? 'Past submissions' : 'Your assignments'} <span className="count-badge">{visible.length}</span></h2></div><select className="select-simple" value={filter} onChange={(event) => setFilter(event.target.value)}>{['All assignments', 'Not Started', 'In Progress', 'Submitted', 'Under Review', 'Graded', 'Rejected'].map((status) => <option key={status}>{status}</option>)}</select></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>ASSIGNMENT</th><th>COURSE</th><th>DUE DATE</th><th>STATUS</th><th></th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><div className="assignment-title"><div className={`assignment-icon assign-${item.status.replace(/\s+/g, '').toLowerCase()}`}><FileText size={17} /></div><span><b>{item.title}</b><small>Assignment · Practical task</small></span></div></td><td>{item.course}</td><td><span className={item.status === 'In Progress' || item.status === 'Not Started' ? 'due-soon' : ''}>{item.due}</span></td><td><StatusPill status={item.status} /></td><td><button className="table-action" onClick={() => onOpen(item.id)}>{item.status === 'Not Started' ? 'Start' : item.status === 'In Progress' ? 'Continue' : 'View'} <ArrowRight size={14} /></button></td></tr>)}</tbody></table></div>
      </div>
      {!showHistory && <div className="assignment-tip"><Sparkles size={17} /><span>Tip: Submit your work early to leave time for feedback and revisions.</span></div>}
    </>
  );
}
function StatusPill({ status }) { const key = status.toLowerCase().replace(/\s+/g, ''); return <span className={`status-pill status-${key}`}><i />{status}</span>; }
function Submission({ assignment, selectedFile, setFile, comment, setComment, onBack, onSubmit, alert }) {
  const chooseFile = (file) => {
    if (file.size > 25 * 1024 * 1024) return alert('Files must be 25 MB or smaller.');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'pptx', 'zip'].includes(extension)) return alert('Upload a PDF, DOCX, PPTX, or ZIP file.');
    setFile(file);
  };
  const fileInput = (event) => { const file = event.target.files?.[0]; if (file) chooseFile(file); };
  return <><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Assignment center</button><PageHeader eyebrow="ASSIGNMENT SUBMISSION" title={assignment.title} description={assignment.course} action={<StatusPill status={assignment.status} />} /><div className="submission-grid"><section className="panel assignment-instructions"><div className="panel-heading"><div><div className="eyebrow">YOUR TASK</div><h2>Assignment instructions</h2></div><span className="due-date-box"><CalendarDays size={15} /> Due {assignment.due}</span></div><p>{assignment.detail}</p><h3>Submission requirements</h3><ul><li>Include your name and course in the document.</li><li>Explain your decisions clearly and reference course materials.</li><li>Upload one file in PDF, DOCX, PPTX, or ZIP format.</li></ul><div className="assignment-rubric"><b><ShieldCheck size={17} /> How your work will be assessed</b><span>Accuracy and completeness <strong>40%</strong></span><span>Application of course concepts <strong>35%</strong></span><span>Clarity and presentation <strong>25%</strong></span></div></section><form className="panel upload-panel" onSubmit={onSubmit}><div className="eyebrow">SUBMIT YOUR WORK</div><h2>Upload assignment</h2><p>Choose a file from your device. Accepted formats: PDF, DOCX, PPTX, ZIP (max 25 MB).</p><label className={`upload-dropzone ${selectedFile ? 'has-file' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) chooseFile(file); }}><input type="file" accept=".pdf,.docx,.pptx,.zip" onChange={fileInput} /><span className="upload-icon">{selectedFile ? <FileCheck2 size={22} /> : <Upload size={22} />}</span><b>{selectedFile ? selectedFile.name : 'Drop your file here'}</b><span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready to submit` : <>or <em>browse files</em></>}</span></label>{selectedFile && <button type="button" className="remove-file" onClick={() => setFile(null)}><X size={14} /> Remove file</button>}<label className="field-label comment-label">Comments <span>Optional</span></label><textarea rows="3" placeholder="Add a note for your instructor..." value={comment} onChange={(event) => setComment(event.target.value)} /><Button className="submit-assignment" icon={Upload}>Submit assignment</Button><div className="secure-note"><LockKeyhole size={13} /> Your work is securely stored in this demo session.</div></form></div></>;
}

function Assessments({ onStart, history }) {
  const [showHistory, setShowHistory] = useState(false);
  return (
    <>
      <PageHeader eyebrow={showHistory ? 'YOUR LEARNING RECORD' : 'CHECK YOUR KNOWLEDGE'} title={showHistory ? 'Assessment history' : 'Assessments'} description="Measure your progress and put your new skills into practice." action={<Button variant="secondary" icon={Clock3} onClick={() => setShowHistory((current) => !current)}>{showHistory ? 'Available assessments' : 'Assessment history'}</Button>} />
      {showHistory ? (
        <div className="panel assessment-list-panel">
          <div className="panel-heading"><div><div className="eyebrow">COMPLETED ATTEMPTS</div><h2>Your assessment history</h2></div><span className="status-pill status-completed"><i />{history.filter((attempt) => attempt.score >= 70).length} passed</span></div>
          {history.length ? history.map((attempt, index) => {
            const passed = attempt.score >= 70;
            return <div className="assessment-row" key={attempt.id}><div className="assessment-badge"><CheckCircle2 size={21} /></div><div className="assessment-info"><h3>Azure Fundamentals · Knowledge check</h3><p>Completed {new Date(attempt.completedAt).toLocaleString()} <span>·</span> Attempt {history.length - index}</p><div className="assessment-chips"><span><Award size={13} /> {attempt.score}% score</span><span>{passed ? <CheckCircle2 size={13} /> : <Clock3 size={13} />} {passed ? 'Passed' : 'Review recommended'}</span></div></div><span className={`status-pill status-${passed ? 'completed' : 'progress'}`}><i />{passed ? 'Passed' : 'Not passed'}</span></div>;
          }) : <div className="empty-state"><CircleHelp size={27} /><h3>No completed assessments yet</h3><p>Your submitted attempts will appear here.</p></div>}
        </div>
      ) : (
        <>
          <div className="assessment-banner"><div className="banner-spark"><Zap size={24} /></div><div><span className="eyebrow">UP NEXT · AZURE FUNDAMENTALS</span><h2>Ready to test what you know?</h2><p>Your Azure Fundamentals knowledge check is ready. You can save and continue at any time.</p><div className="assessment-meta"><span><CircleHelp size={15} /> 3 questions</span><span><Clock3 size={15} /> 15 minutes</span><span><CheckCircle2 size={15} /> 70% to pass</span></div></div><Button onClick={onStart}>Start assessment <ArrowRight size={16} /></Button></div>
          <div className="panel assessment-list-panel">
            <div className="panel-heading"><div><div className="eyebrow">YOUR ASSESSMENTS</div><h2>Available assessments</h2></div><span className="tag">1 available</span></div>
            <div className="assessment-row"><div className="assessment-badge"><CircleHelp size={21} /></div><div className="assessment-info"><h3>Azure Fundamentals · Knowledge check</h3><p>Azure Fundamentals <span>·</span> Module 2 <span>·</span> Objective assessment</p><div className="assessment-chips"><span><Clock3 size={13} /> 15 min</span><span><CircleHelp size={13} /> 3 questions</span><span><Award size={13} /> 70% to pass</span></div></div><div className="assessment-row-status"><span className="status-pill status-notstarted"><i />Not started</span><Button variant="secondary" onClick={onStart}>Begin <ArrowRight size={14} /></Button></div></div>
            <div className="assessment-row assessment-locked"><div className="assessment-badge grey"><LockKeyhole size={20} /></div><div className="assessment-info"><h3>Azure Administrator · Module assessment</h3><p>Azure Administrator <span>·</span> Module 1 <span>·</span> Objective assessment</p><div className="assessment-chips"><span><Clock3 size={13} /> 20 min</span><span><CircleHelp size={13} /> 10 questions</span></div></div><span className="locked-text"><LockKeyhole size={14} /> Complete module first</span></div>
          </div>
          <div className="assessment-tip"><CircleHelp size={17} /><span><b>Before you begin</b> Find a quiet space and make sure you have about 15 minutes. Your assessment is not timed in this demo.</span></div>
        </>
      )}
    </>
  );
}
function Quiz({ answers, setAnswers, onSubmit, onSave }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timer);
          onSubmit();
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const question = quizQuestions[questionIndex];
  const toggleAnswer = (optionIndex) => setAnswers((current) => {
    if (question.type === 'multi') { const selected = current[questionIndex] || []; return { ...current, [questionIndex]: selected.includes(optionIndex) ? selected.filter((item) => item !== optionIndex) : [...selected, optionIndex] }; }
    return { ...current, [questionIndex]: optionIndex };
  });
  const selected = answers[questionIndex];
  return <><div className="quiz-top"><button className="back-link" onClick={() => window.confirm('Leave this assessment? Your answers are saved in this demo.') && onSave()}><ArrowLeft size={15} /> Assessments</button><div className="quiz-title"><span>AZURE FUNDAMENTALS</span><b>Knowledge check</b></div><button className="button button-secondary" onClick={onSave}>Save & exit</button></div><div className="quiz-layout"><section className="panel quiz-main"><div className="quiz-progress-info"><span>QUESTION {fmt(questionIndex + 1)} <i>OF</i> {fmt(quizQuestions.length)}</span><span><Clock3 size={15} /> {fmt(Math.floor(secondsLeft / 60))}:{fmt(secondsLeft % 60)}</span></div><ProgressBar value={((questionIndex + 1) / quizQuestions.length) * 100} /><div className="question-type">{question.type === 'multi' ? 'MULTIPLE SELECT' : question.type === 'truefalse' ? 'TRUE OR FALSE' : 'MULTIPLE CHOICE'}{question.type === 'multi' && <span> · Select all that apply</span>}</div><h1>{question.question}</h1><div className="answer-options">{question.options.map((option, index) => { const active = question.type === 'multi' ? (selected || []).includes(index) : selected === index; return <button className={`answer-option ${active ? 'answer-selected' : ''}`} key={option} onClick={() => toggleAnswer(index)}><span className={`answer-mark ${question.type === 'multi' ? 'checkbox-mark' : ''}`}>{active && <Check size={14} />}</span><span>{option}</span><kbd>{String.fromCharCode(65 + index)}</kbd></button>; })}</div><div className="quiz-footer"><Button variant="ghost" onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0}><ChevronLeft size={16} /> Previous</Button><span>{Object.keys(answers).length} of {quizQuestions.length} answered</span>{questionIndex < quizQuestions.length - 1 ? <Button onClick={() => setQuestionIndex(questionIndex + 1)}>Next question <ChevronRight size={16} /></Button> : <Button onClick={onSubmit}>Submit assessment <Check size={15} /></Button>}</div></section><aside className="panel quiz-sidebar"><div className="eyebrow">QUESTION NAVIGATION</div><h3>Your questions</h3><div className="question-nav">{quizQuestions.map((item, index) => <button key={item.question} className={`${questionIndex === index ? 'current' : ''} ${answers[index] !== undefined ? 'answered' : ''}`} onClick={() => setQuestionIndex(index)}>{fmt(index + 1)}{answers[index] !== undefined && <Check size={13} />}</button>)}</div><div className="quiz-side-divider" /><div className="quiz-help"><CircleHelp size={17} /><span>Take your time. You can review your answers before submitting.</span></div><Button variant="secondary" className="quiz-save" onClick={onSave}>Save progress</Button></aside></div></>;
}
function Results({ score, answers, completedAt, onRetry }) {
  const passed = score / quizQuestions.length * 100 >= 70;
  return <><PageHeader eyebrow="ASSESSMENT COMPLETE" title="Your results" description="Azure Fundamentals · Knowledge check" /><div className="result-layout"><div className={`result-card ${passed ? 'passed' : 'failed'}`}><div className="result-icon">{passed ? <CheckCircle2 size={28} /> : <Activity size={28} />}</div><div className="eyebrow">{passed ? 'NICE WORK' : 'KEEP PRACTICING'}</div><h2>{passed ? 'You passed!' : 'Not quite there yet'}</h2><p>{passed ? 'You’ve demonstrated a solid understanding of Azure fundamentals.' : 'Review your course material and try again when you’re ready.'}</p><div className="result-score"><strong>{Math.round(score / quizQuestions.length * 100)}<small>%</small></strong><span>YOUR SCORE</span></div><div className="result-threshold"><span>Passing score</span><b>70%</b></div><ProgressBar value={score / quizQuestions.length * 100} color={passed ? 'green' : 'orange'} /><div className="result-date"><CalendarDays size={14} /> Completed {completedAt ? new Date(completedAt).toLocaleString() : 'just now'}</div><Button onClick={onRetry}>{passed ? 'Back to assessments' : 'Try again'} <ArrowRight size={15} /></Button></div><div className="panel result-breakdown"><div className="eyebrow">PERFORMANCE BREAKDOWN</div><h2>Question summary</h2>{quizQuestions.map((question, index) => { const selected = answers[index]; const isCorrect = question.type === 'multi' ? JSON.stringify([...(selected || [])].sort()) === JSON.stringify([...question.answer].sort()) : selected === question.answer; return <div className="result-question" key={question.question}><span className={`answer-result-icon ${isCorrect ? 'correct' : 'incorrect'}`}>{isCorrect ? <Check size={15} /> : <X size={15} />}</span><div><b>Question {index + 1}</b><p>{question.question}</p></div><span className={isCorrect ? 'result-correct-label' : 'result-wrong-label'}>{isCorrect ? 'Correct' : 'Review'}</span></div>; })}<div className="result-review-note"><Sparkles size={16} /> Keep learning — each attempt is a chance to grow.</div></div></div></>;
}

function Certifications({ courses: courseList, onDownload, onCourse }) {
  const inProgress = courseList.filter((course) => course.enrolled && course.progress > 0 && course.progress < 100);
  return (
    <>
      <PageHeader eyebrow="CELEBRATE YOUR PROGRESS" title="My certifications" description="Your achievements and the credentials you're working toward." action={<Button variant="secondary" icon={ShieldCheck} onClick={() => window.alert('Verification is simulated for demo certificates.')}>Verify a certificate</Button>} />
      <div className="cert-summary"><div><Award size={20} /><span><b>1</b> certification earned</span></div><div><Activity size={20} /><span><b>{inProgress.length}</b> in progress</span></div><div><Clock3 size={20} /><span><b>1</b> pending</span></div><div className="cert-summary-note"><ShieldCheck size={18} /><span>Demo certificates are samples, not official Microsoft credentials.</span></div></div>
      <div className="cert-section-head"><div><div className="eyebrow">YOUR ACHIEVEMENTS</div><h2>Earned certifications <span>1</span></h2></div></div>
      <div className="earned-cert-card">
        <div className="earned-cert-art">
          <div className="cert-rosette"><Award size={25} /></div>
          <div className="certificate-preview-copy"><span>LEARNING HUB</span><small>SAMPLE CERTIFICATE</small><b>Kranthi Thimmayya</b><p>Azure AI Fundamentals</p><i>November 18, 2026</i></div>
          <div className="qr-placeholder">QR</div>
        </div>
        <div className="earned-cert-copy">
          <span className="cert-earned-label"><CheckCircle2 size={14} /> VERIFIED · DEMO</span>
          <h3>Azure AI Fundamentals</h3>
          <p>Successfully completed the learning path and assessment.</p>
          <div className="cert-fields"><span>COMPLETION DATE<b>November 18, 2026</b></span><span>CERTIFICATE ID<b>MLH-2026-AI900-0482</b></span><span>AUTHORIZED ISSUER<b>Learning Hub Program Director</b></span></div>
          <div className="cert-actions"><Button icon={Download} onClick={() => onDownload('Azure AI Fundamentals')}>Download certificate PDF</Button><button className="link-button" onClick={() => window.alert('QR verification is a placeholder for this sample certificate.')}>Verification details <ArrowRight size={14} /></button></div>
        </div>
      </div>
      <div className="cert-section-head"><div><div className="eyebrow">NEXT MILESTONES</div><h2>Certifications in progress <span>{inProgress.length}</span></h2></div><button className="link-button" onClick={() => onCourse('az900')}>Explore certification paths <ArrowRight size={14} /></button></div>
      <div className="cert-progress-grid">{inProgress.map((course) => <div className="panel cert-progress-card" key={course.id}><div className="cert-progress-icon"><Award size={20} /></div><span className="tag">{course.code}</span><h3>{course.title}</h3><p>Complete the learning path and pass your assessment to earn your certificate.</p><div className="cert-progress-line"><ProgressBar value={course.progress} /><b>{course.progress}%</b></div><button className="link-button" onClick={() => onCourse(course.id)}>Continue learning <ArrowRight size={14} /></button></div>)}</div>
      <div className="pending-cert"><div className="pending-cert-icon"><LockKeyhole size={19} /></div><div><b>Azure Administrator Associate</b><span>Complete Azure Administrator and pass the AZ-104 assessment.</span></div><span className="status-pill status-notstarted"><i />Not started</span></div>
    </>
  );
}

function Notifications({ readIds, filter, setFilter, onReadAll, onRead, onSettings }) {
  const visible = notifications.filter((item) => filter === 'All' || (filter === 'Unread'
    ? item.unread && !readIds.includes(item.title)
    : !item.unread || readIds.includes(item.title)));
  const icons = { CalendarDays, FileCheck2, Award, BookOpen };
  const unreadCount = notifications.filter((item) => item.unread && !readIds.includes(item.title)).length;
  return <>
    <PageHeader eyebrow="STAY IN THE LOOP" title="Notifications" description="The latest updates on your learning, submissions, and upcoming deadlines." action={<Button variant="secondary" onClick={onReadAll} disabled={!unreadCount}>Mark all as read <Check size={15} /></Button>} />
    <div className="notification-toolbar"><div className="tabs">{['All', 'Unread', 'Read'].map((tab) => <button key={tab} className={filter === tab ? 'selected' : ''} onClick={() => setFilter(tab)}>{tab}<span>{tab === 'All' ? notifications.length : tab === 'Unread' ? unreadCount : notifications.length - unreadCount}</span></button>)}</div><button className="link-button" onClick={onSettings}><Settings size={14} /> Notification settings</button></div>
    <div className="notification-list">{visible.map((item, index) => {
      const Icon = icons[item.icon] || Bell;
      const isRead = readIds.includes(item.title) || !item.unread;
      return <article className={`notification-card ${!isRead ? 'unread' : ''}`} key={item.title}>
        <div className={`notification-icon notification-${notifications.indexOf(item)}`}><Icon size={19} /></div>
        <div className="notification-copy"><div><b>{item.title}</b>{!isRead && <i className="unread-dot" />}</div><p>{item.text}</p><span>{item.time}</span></div>
        {!isRead && <button className="notification-read-button" onClick={() => onRead(item.title)}>Mark as read</button>}
      </article>;
    })}</div>
    {visible.length === 0 && <div className="empty-state"><Bell size={27} /><h3>No {filter.toLowerCase()} notifications</h3><p>You're all caught up for now.</p></div>}
    {filter !== 'Unread' && unreadCount === 0 && <div className="notifications-end"><CheckCircle2 size={17} /> You're all caught up!</div>}
  </>;
}

function ProfilePage({ profile, account, mode, onChange, onSave }) {
  return <>
    <PageHeader eyebrow="YOUR ACCOUNT" title="My Profile" description="Keep your learning profile up to date." action={<Button icon={Check} onClick={onSave}>Save changes</Button>} />
    <form className="account-page-grid" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <section className="panel profile-summary-panel"><div className="profile-large-avatar">{profile.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><h2>{profile.displayName}</h2><p>{profile.designation}</p><span className="account-role-chip"><GraduationCap size={14} /> Learning participant</span><div className="profile-identity-detail"><span>ACCOUNT TYPE</span><b>{mode === 'demo' ? 'Demo account' : 'Organizational account'}</b></div><div className="profile-identity-detail"><span>EMAIL</span><b>{account?.username || 'kranthi@example.com'}</b></div></section>
      <section className="panel profile-form-panel"><div className="eyebrow">PERSONAL INFORMATION</div><h2>Profile details</h2><p className="form-description">Your email and identity are managed by your sign-in provider.</p>
        <div className="form-grid">
          <label className="field-label">Display name<input value={profile.displayName} onChange={(event) => onChange('displayName', event.target.value)} required maxLength={80} /></label>
          <label className="field-label">Email address<input value={account?.username || 'kranthi@example.com'} readOnly disabled /></label>
          <label className="field-label">Job title<input value={profile.designation} onChange={(event) => onChange('designation', event.target.value)} maxLength={100} /></label>
          <label className="field-label">Department<input value={profile.department} onChange={(event) => onChange('department', event.target.value)} maxLength={80} /></label>
          <label className="field-label">Phone number<input type="tel" value={profile.phone} onChange={(event) => onChange('phone', event.target.value)} maxLength={30} /></label>
          <label className="field-label">Employee ID<input value={profile.employeeId} readOnly disabled /></label>
          <label className="field-label">Manager<input value={profile.manager} readOnly disabled /></label>
        </div>
        <div className="profile-save-row"><span><ShieldCheck size={15} /> Profile edits are saved locally in this prototype.</span><Button type="submit" icon={Check}>Save profile</Button></div>
      </section>
    </form>
  </>;
}

function AccountSettings({ account, role, mode, onSignOut }) {
  return <>
    <PageHeader eyebrow="SECURITY & ACCOUNT" title="Account Settings" description="Review your sign-in method and account details." />
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="settings-panel-icon"><UserCog size={20} /></div><div className="eyebrow">SIGN-IN IDENTITY</div><h2>Account information</h2><p>Identity credentials are controlled by your configured sign-in provider.</p><div className="setting-detail-row"><span>Email address</span><b>{account?.username || 'kranthi@example.com'}</b></div><div className="setting-detail-row"><span>Provider</span><b>{mode === 'demo' ? 'Local demo sign-in' : 'Microsoft Entra ID'}</b></div><div className="setting-detail-row"><span>Current role</span><b>{role}{mode === 'demo' ? ' (preview)' : ''}</b></div><div className="integration-note"><ShieldCheck size={16} /> This frontend role display is not a security boundary. Protect APIs with server-side authorization.</div><Button variant="secondary" icon={LogOut} onClick={onSignOut}>Sign out</Button></section>
      <section className="panel settings-panel"><div className="settings-panel-icon"><LockKeyhole size={20} /></div><div className="eyebrow">PASSWORD & SECURITY</div><h2>Authentication settings</h2><p>{mode === 'demo' ? 'This prototype does not store or validate passwords. Demo sign-in accepts any email and password.' : 'Password, MFA, and recovery options are managed by your organization.'}</p><div className="security-status"><CheckCircle2 size={17} /><span><b>{mode === 'demo' ? 'Demo authentication' : 'Organization-managed identity'}</b><small>{mode === 'demo' ? 'No password is saved in browser storage.' : 'Configured authentication uses Microsoft Entra ID.'}</small></span></div><div className="integration-note"><SlidersHorizontal size={16} /> Add Entra conditional access, MFA, and role assignment through tenant policy before production use.</div></section>
    </div>
  </>;
}

function NotificationSettings({ preferences, onChange }) {
  const switches = [
    ['emailDeadlines', 'Assignment and assessment reminders', 'Get email reminders before due dates.'],
    ['emailGrades', 'Grading and assessment results', 'Know when a score or review is available.'],
    ['emailCourseUpdates', 'Course and instructor updates', 'Receive learning material and course announcements.'],
    ['productUpdates', 'Learning Hub product updates', 'Receive occasional feature and service announcements.'],
    ['compactMode', 'Compact interface', 'Use tighter spacing for lists and course cards.'],
  ];
  return <>
    <PageHeader eyebrow="PREFERENCES" title="Notification Preferences" description="Choose which learning updates you want to receive." />
    <div className="settings-grid"><section className="panel preferences-panel"><div className="eyebrow">MESSAGES & DISPLAY</div><h2>Your preferences</h2><p className="form-description">Preferences are saved in this browser for this account.</p>
      {switches.map(([key, title, description]) => <label className="preference-row" key={key}><span><b>{title}</b><small>{description}</small></span><input type="checkbox" role="switch" checked={Boolean(preferences[key])} onChange={(event) => onChange(key, event.target.checked)} /></label>)}
      <label className="field-label language-setting">Language and region<select value={preferences.language} onChange={(event) => onChange('language', event.target.value)}><option>English (United States)</option><option>English (United Kingdom)</option><option>French (France)</option><option>Spanish (Spain)</option></select></label>
    </section><section className="panel settings-panel"><div className="settings-panel-icon"><Globe2 size={20} /></div><div className="eyebrow">DELIVERY INFORMATION</div><h2>About notifications</h2><p>This prototype does not send emails or push notifications. The preferences are saved locally to demonstrate the settings experience.</p><div className="integration-note"><Mail size={16} /> Connect notification delivery to a trusted backend before enabling real reminders.</div></section></div>
  </>;
}

function HelpPage() {
  return <>
    <PageHeader eyebrow="SUPPORT" title="Help and Support" description="Find answers to common questions about this learning portal demo." />
    <div className="settings-grid"><section className="panel help-content-panel"><div className="eyebrow">FREQUENTLY ASKED QUESTIONS</div><h2>How can we help?</h2>
      <details><summary>How do I save my learning progress?</summary><p>Course enrollment, completed lessons, assignment metadata, assessment drafts, and preferences are stored in this browser for the demo.</p></details>
      <details><summary>Are uploaded assignment files stored?</summary><p>No. File contents stay in the current browser session. Only the filename and submission status are recorded in local demo state.</p></details>
      <details><summary>Are the certificates official?</summary><p>No. Certificates in this prototype are sample demonstrations and are not Microsoft credentials.</p></details>
      <details><summary>Who can access administrator tools?</summary><p>Role previews only adjust the interface in this prototype. Production APIs must independently authenticate users and enforce authorization.</p></details>
      </section><section className="panel settings-panel"><div className="settings-panel-icon"><LifeBuoy size={20} /></div><div className="eyebrow">CONTACT SUPPORT</div><h2>Need more help?</h2><p>Contact your learning program administrator for account or course questions.</p><a className="button button-secondary support-link" href="mailto:learning-support@example.com"><Mail size={16} /> Email learning support</a><div className="integration-note"><CircleHelp size={16} /> Demo support contact. Replace with your organization's support channel.</div></section></div>
  </>;
}

function AboutPage() {
  return <>
    <PageHeader eyebrow="ABOUT THIS EXPERIENCE" title="Microsoft Learning Hub" description="A learning management portal prototype for stakeholder demonstration." />
    <section className="panel about-panel"><div className="about-brand-mark"><BookOpen size={24} /></div><div><div className="eyebrow">DEMO PROTOTYPE</div><h2>Built to explore learning workflows</h2><p>This responsive prototype demonstrates course discovery, assignments, assessments, certification tracking, account preferences, and role-based interface previews.</p><div className="integration-note"><ShieldCheck size={16} /> Not an official Microsoft product. Microsoft names are used only to describe sample learning content; no Microsoft logo or endorsement is implied.</div><div className="about-tags"><span>React</span><span>Vite</span><span>Mock data</span><span>Optional Entra configuration</span></div></div></section>
  </>;
}

function AccessDenied({ onBack }) {
  return <section className="panel access-denied-panel"><div className="settings-panel-icon"><LockKeyhole size={21} /></div><div className="eyebrow">ACCESS UNAVAILABLE</div><h2>This workspace is not available for your role</h2><p>Switch to an authorized demo role or return to your dashboard. Production access must be enforced by the backend.</p><Button onClick={onBack}>Return to dashboard <ArrowRight size={15} /></Button></section>;
}

function DeprecatedNotifications({ read, setRead }) {
  return <><PageHeader eyebrow="STAY IN THE LOOP" title="Notifications" description="The latest updates on your learning, submissions, and upcoming deadlines." action={<Button variant="secondary" onClick={() => setRead(true)}>Mark all as read <Check size={15} /></Button>} /><div className="notification-toolbar"><div className="tabs"><button className="selected">All <span>4</span></button><button>Unread <span>{read ? '0' : '2'}</span></button></div><button className="link-button"><Settings size={14} /> Notification settings</button></div><div className="notification-list">{notifications.map((item, index) => { const Icon = ({ CalendarDays, FileCheck2, Award, BookOpen })[item.icon]; return <article className={`notification-card ${item.unread && !read ? 'unread' : ''}`} key={item.title}><div className={`notification-icon notification-${index}`}><Icon size={19} /></div><div className="notification-copy"><div><b>{item.title}</b>{item.unread && !read && <i className="unread-dot" />}</div><p>{item.text}</p><span>{item.time}</span></div><button className="icon-btn" aria-label="Notification options"><MoreHorizontal size={19} /></button></article>; })}</div><div className="notifications-end"><CheckCircle2 size={17} /> You're all caught up!</div></>;
}

function Instructor({ alert }) {
  const [tab, setTab] = useState('Overview');
  return <><PageHeader eyebrow="TEACHING WORKSPACE" title="Instructor dashboard" description="Manage your courses, support learners, and review submissions." action={<Button icon={Plus} onClick={() => alert('Course creation is a demo interaction. Backend integration can be added here.')}>Create a course</Button>} /><div className="role-banner"><BriefcaseBusiness size={17} /><span><b>Instructor role preview</b> — Switch roles from your profile menu in the sidebar.</span></div><div className="stats-grid"><StatCard icon={BookOpen} label="Active courses" value="6" trend="1" /><StatCard icon={Users} label="Enrolled learners" value="248" trend="18%" color="purple" /><StatCard icon={FileCheck2} label="To review" value="12" color="orange" footnote="Across 3 courses" /><StatCard icon={Activity} label="Avg. completion" value="76%" color="green" trend="4%" /></div><div className="tabs instructor-tabs">{['Overview', 'My courses', 'Submissions'].map((item) => <button key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}{item === 'Submissions' && <span className="tab-count">12</span>}</button>)}</div>{tab === 'Overview' ? <div className="instructor-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">LEARNER ACTIVITY</div><h2>Course engagement</h2></div><select className="select-simple"><option>Last 30 days</option><option>Last 7 days</option></select></div><EngagementChart /></div><div className="panel review-panel"><div className="panel-heading"><div><div className="eyebrow">NEEDS YOUR ATTENTION</div><h2>Submissions to review</h2></div><span className="count-badge">12</span></div>{['Cloud architecture diagram', 'Identity & access review', 'AI responsible use reflection'].map((title, index) => <div className="review-row" key={title}><div className="review-avatar">{['JR', 'AM', 'DK'][index]}</div><div><b>{title}</b><span>{['Jordan Rivera', 'Avery Morgan', 'Devon Kim'][index]} · {index + 1} day ago</span></div><button className="link-button" onClick={() => alert('Submission review is a simulated demo action.')}>Review <ArrowRight size={13} /></button></div>)}</div></div> : <div className="panel instructor-table">{tab === 'Submissions' ? <Assignments assignments={initialAssignments.filter((item) => item.status === 'Submitted' || item.status === 'In Progress')} onOpen={() => alert('Submission grading is simulated in this demo.')} /> : <div className="catalog-grid">{courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} onCourse={() => alert(`Managing ${course.title}`)} alert={alert} />)}</div>}</div>}</>;
}

function EngagementChart() {
  const heights = [35, 54, 41, 69, 50, 78, 57, 86, 62, 92, 70, 81];
  return <div className="engagement-chart"><div className="chart-y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div><div className="chart-bars">{heights.map((height, index) => <div className="chart-column" key={index}><span style={{ height: `${height}%` }} /><small>{['W1', 'W2', 'W3', 'W4'][index % 4]}</small></div>)}</div></div>;
}
function Admin({ onNavigate }) {
  return <><PageHeader eyebrow="ORGANIZATION OVERVIEW" title="Admin dashboard" description="A real-time view of learning across your organization." action={<Button variant="secondary" icon={Download} onClick={() => onNavigate('reports')}>Export report</Button>} /><div className="role-banner admin-banner"><ShieldCheck size={17} /><span><b>Administrator role preview</b> — Explore user, course, and reporting management tools.</span></div><div className="stats-grid admin-stats"><StatCard icon={Users} label="Registered learners" value="2,486" trend="12%" /><StatCard icon={Activity} label="Active this month" value="1,842" trend="8%" color="green" /><StatCard icon={BookOpen} label="Available courses" value="34" trend="4" color="purple" /><StatCard icon={Award} label="Certifications issued" value="628" trend="16%" color="orange" /></div><div className="admin-grid"><section className="panel admin-chart-panel"><div className="panel-heading"><div><div className="eyebrow">LEARNING ENGAGEMENT</div><h2>Organization activity</h2></div><select className="select-simple"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select></div><EngagementChart /></section><section className="panel completion-panel"><div className="panel-heading"><div><div className="eyebrow">LEARNING HEALTH</div><h2>Course completion</h2></div><button className="icon-btn" aria-label="Course completion details"><MoreHorizontal size={18} /></button></div><div className="completion-big"><b>74<span>%</span></b><small>Average completion rate</small></div><div className="completion-breakdown"><span><i className="legend-green" /> Completed <b>1,298</b></span><span><i className="legend-blue" /> In progress <b>906</b></span><span><i className="legend-grey" /> Not started <b>282</b></span></div></section></div><div className="admin-bottom-grid"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">NEEDS ATTENTION</div><h2>Operational overview</h2></div></div><div className="admin-action-row"><FileCheck2 size={18} /><span><b>Pending assignments</b><small>Requires instructor review</small></span><strong>42</strong><button className="link-button" onClick={() => onNavigate('assignments')}>View <ArrowRight size={13} /></button></div><div className="admin-action-row"><CircleHelp size={18} /><span><b>Assessment pass rate</b><small>Across active assessments</small></span><strong>86%</strong><button className="link-button" onClick={() => onNavigate('reports')}>View <ArrowRight size={13} /></button></div></section><section className="panel admin-quick-actions"><div className="eyebrow">QUICK ACTIONS</div><h2>Manage your hub</h2><button onClick={() => onNavigate('users')}><Users size={17} /><span><b>Manage users</b><small>Roles and access</small></span><ArrowRight size={15} /></button><button onClick={() => onNavigate('catalog')}><BookOpen size={17} /><span><b>Manage courses</b><small>Catalog and content</small></span><ArrowRight size={15} /></button><button onClick={() => onNavigate('reports')}><BarChart3 size={17} /><span><b>View reports</b><small>Engagement analytics</small></span><ArrowRight size={15} /></button></section></div></>;
}
function BackgroundJobs({ alert }) {
  const [runningJob, setRunningJob] = useState('');
  const jobs = [
    { title: 'Assignment grading', detail: '12 submissions queued', icon: FileCheck2, frequency: 'On submission', status: 'Queue active' },
    { title: 'Certificate generation', detail: '4 certificates pending', icon: Award, frequency: 'On completion', status: 'Queue active' },
    { title: 'Deadline reminders', detail: '28 reminders scheduled', icon: Bell, frequency: 'Daily · 9:00 AM', status: 'Scheduled' },
    { title: 'Learning reports', detail: 'Next report in 2 hours', icon: BarChart3, frequency: 'Every 6 hours', status: 'Scheduled' },
  ];
  return <section className="panel jobs-panel"><div className="panel-heading"><div><div className="eyebrow">AUTOMATION & OPERATIONS</div><h2>Background job queue</h2><p>Demo orchestration for grading, certificate generation, reminders, and reporting.</p></div><span className="job-health"><i /> All systems operational</span></div><div className="job-grid">{jobs.map((job) => { const Icon = job.icon; const isRunning = runningJob === job.title; return <article className="job-card" key={job.title}><div className="job-card-top"><div className="job-icon"><Icon size={17} /></div><span className={`job-status ${isRunning ? 'job-running' : ''}`}><i />{isRunning ? 'Running' : job.status}</span></div><h3>{job.title}</h3><p>{job.detail}</p><div className="job-card-bottom"><span>{job.frequency}</span><button disabled={isRunning} onClick={() => { setRunningJob(job.title); alert(`${job.title} started in demo mode.`); window.setTimeout(() => setRunningJob(''), 1600); }}>{isRunning ? 'Running…' : 'Run now'} <ArrowRight size={13} /></button></div></article>; })}</div></section>;
}
function UsersPage({ alert }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [usersList, setUsersList] = useState([{ name: 'Kranthi Thimmayya', email: 'kranthi@example.com', role: 'Student', status: 'Active', initials: 'KT' }, { name: 'Jordan Rivera', email: 'jordan.rivera@contoso.com', role: 'Instructor', status: 'Active', initials: 'JR' }, { name: 'Avery Morgan', email: 'avery.morgan@contoso.com', role: 'Student', status: 'Active', initials: 'AM' }, { name: 'Devon Kim', email: 'devon.kim@contoso.com', role: 'Student', status: 'Pending', initials: 'DK' }, { name: 'Samira Ali', email: 'samira.ali@contoso.com', role: 'Administrator', status: 'Active', initials: 'SA' }]);
  const filtered = usersList.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()) && (roleFilter === 'All roles' || user.role === roleFilter));
  return (
    <>
      <PageHeader eyebrow="PEOPLE & ACCESS" title="User management" description="Manage learners, instructors, and administrator access." action={<Button icon={Plus} onClick={() => alert('Invite user flow is a simulated demo action.')}>Invite users</Button>} />
      <div className="stats-grid user-stats"><StatCard icon={Users} label="Total users" value="2,486" /><StatCard icon={GraduationCap} label="Students" value="2,412" color="purple" /><StatCard icon={BriefcaseBusiness} label="Instructors" value="68" color="green" /><StatCard icon={Clock3} label="Pending invites" value="6" color="orange" /></div>
      <div className="panel users-panel">
        <div className="panel-heading">
          <div><div className="eyebrow">ALL USERS</div><h2>People <span className="count-badge">2,486</span></h2></div>
          <div className="table-toolbar">
            <label className="table-search"><Search size={15} /><input placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="select-simple" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>All roles</option><option>Student</option><option>Instructor</option><option>Administrator</option></select>
            <Button variant="secondary" icon={Filter} onClick={() => { setSearch(''); setRoleFilter('All roles'); }}>Clear filters</Button>
          </div>
        </div>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>USER</th><th>ROLE</th><th>STATUS</th><th>LAST ACTIVE</th><th></th></tr></thead>
          <tbody>{filtered.map((user) => <tr key={user.email}>
            <td><div className="user-cell"><div className="review-avatar">{user.initials}</div><span><b>{user.name}</b><small>{user.email}</small></span></div></td>
            <td><select className="role-select" value={user.role} onChange={(event) => { setUsersList((list) => list.map((item) => item.email === user.email ? { ...item, role: event.target.value } : item)); alert(`${user.name}'s role updated`); }}><option>Student</option><option>Instructor</option><option>Administrator</option></select></td>
            <td><span className={`status-pill status-${user.status.toLowerCase()}`}><i />{user.status}</span></td><td>{user.name === 'Kranthi Thimmayya' ? 'Just now' : 'Today'}</td>
            <td><button className="icon-btn" onClick={() => alert(`User options for ${user.name}`)} aria-label={`Options for ${user.name}`}><MoreHorizontal size={19} /></button></td>
          </tr>)}</tbody>
        </table></div>
        <div className="table-pagination"><span>Showing {filtered.length} of 2,486 users</span><div><button disabled><ChevronLeft size={15} /></button><b>1</b><button>2</button><button>3</button><span>...</span><button>249</button><button><ChevronRight size={15} /></button></div></div>
      </div>
    </>
  );
}
function Reports({ date, setDate }) {
  const [reportTab, setReportTab] = useState('Engagement');
  return <><PageHeader eyebrow="INSIGHTS & ANALYTICS" title="Reports & analytics" description="Understand learning engagement and make data-informed decisions." action={<><select className="select-simple report-date" value={date} onChange={(event) => setDate(event.target.value)}><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option><option>This year</option></select><Button variant="secondary" icon={Download} onClick={() => window.alert('Report export is simulated in this demo.')}>Export report</Button></>} /><div className="stats-grid report-stats"><StatCard icon={Users} label="Active learners" value="1,842" trend="8%" /><StatCard icon={CheckCircle2} label="Completion rate" value="74%" trend="6%" color="green" /><StatCard icon={CircleHelp} label="Assessment pass rate" value="86%" trend="3%" color="purple" /><StatCard icon={Award} label="Certifications issued" value="128" trend="16%" color="orange" /></div><div className="tabs report-tabs">{['Engagement', 'Course performance', 'Assessments', 'Certifications'].map((tab) => <button key={tab} className={reportTab === tab ? 'selected' : ''} onClick={() => setReportTab(tab)}>{tab}</button>)}</div><div className="report-main-grid"><section className="panel report-engagement"><div className="panel-heading"><div><div className="eyebrow">LEARNER ENGAGEMENT</div><h2>{reportTab} over time</h2></div><span className="chart-legend"><i /> Active learners</span></div><EngagementChart /></section><section className="panel report-categories"><div className="panel-heading"><div><div className="eyebrow">LEARNING CATEGORIES</div><h2>Popular subjects</h2></div></div>{[['Cloud & infrastructure', 82, 'blue'], ['AI & data', 68, 'purple'], ['Security', 54, 'orange'], ['Developer tools', 39, 'green']].map(([label, value, color]) => <div className="category-stat" key={label}><div><span>{label}</span><b>{value}%</b></div><ProgressBar value={value} color={color} /></div>)}</section></div><div className="panel report-courses"><div className="panel-heading"><div><div className="eyebrow">TOP PERFORMING COURSES</div><h2>Course engagement</h2></div><button className="link-button">View all courses <ArrowRight size={14} /></button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>COURSE</th><th>ENROLLED</th><th>COMPLETION RATE</th><th>ASSESSMENT PASS</th><th>AVG. PROGRESS</th></tr></thead><tbody>{courses.slice(0, 4).map((course, index) => <tr key={course.id}><td><div className="report-course-cell"><div className={`tiny-course-icon art-${course.color}`}>{course.icon}</div><span><b>{course.title}</b><small>{course.code}</small></span></div></td><td>{[486, 342, 286, 224][index]}</td><td><span className="table-positive">{[82, 74, 69, 88][index]}%</span></td><td>{[91, 84, 79, 94][index]}%</td><td>{[76, 62, 58, 81][index]}%</td></tr>)}</tbody></table></div></div></>;
}

export default App;
