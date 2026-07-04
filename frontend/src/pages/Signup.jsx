import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, Shield, Building, Award, CircleDollarSign, Loader2, Check, X } from 'lucide-react';
import api from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    designation: '',
    salary: '',
  });

  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validate password rules as it changes
  useEffect(() => {
    const password = formData.password;
    setPasswordRules({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
    });
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check password rules matching
    const allRulesMet = Object.values(passwordRules).every(Boolean);
    if (!allRulesMet) {
      setError('Please ensure your password meets all safety criteria.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/api/auth/register', {
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || 'IT',
        designation: formData.designation || 'Software Developer',
        salary: formData.salary ? Number(formData.salary) : 25000,
      });

      if (res.data.success) {
        setSuccess(res.data.message || 'Registration successful! Verification email sent.');
        setFormData({
          employeeId: '',
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'employee',
          department: '',
          designation: '',
          salary: '',
        });
      } else {
        setError(res.data.message || 'Signup failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RuleIndicator = ({ label, met }) => (
    <div className="flex items-center space-x-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
      ) : (
        <X className="h-3.5 w-3.5 text-slate-600" />
      )}
      <span className={met ? 'text-emerald-400 font-medium' : 'text-slate-400'}>{label}</span>
    </div>
  );

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-6 text-white overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 my-8 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="rounded-2xl bg-indigo-600/10 border border-indigo-500/20 p-3 text-indigo-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm">
            Sign up to get access to the HRMS Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Employee ID */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Employee ID
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP003"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                System Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3.5 px-4 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="employee" className="bg-slate-900">Employee</option>
                <option value="hr" className="bg-slate-900">HR Specialist</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Department
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="IT, Marketing..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Designation
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Salary */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Monthly Basic Salary (INR)
              </label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="30000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

          </div>

          {/* Password strength checklist */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password Safety Rules</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RuleIndicator label="At least 8 characters long" met={passwordRules.minLength} />
              <RuleIndicator label="At least 1 uppercase letter" met={passwordRules.hasUpper} />
              <RuleIndicator label="At least 1 lowercase letter" met={passwordRules.hasLower} />
              <RuleIndicator label="At least 1 number" met={passwordRules.hasNumber} />
              <RuleIndicator label="At least 1 special character (@$!%*?&)" met={passwordRules.hasSpecial} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 outline-none transition duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Register & Send Verification'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Signup;
