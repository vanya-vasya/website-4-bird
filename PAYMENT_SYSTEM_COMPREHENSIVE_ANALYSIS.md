# Payment & Token System Comprehensive Analysis

> Generated: October 24, 2025  
> Repository: yum-mi (Next.js 14 App Router + PostgreSQL + Prisma)

---

## Executive Summary

This document provides a complete analysis of the payment processing and token balance management system for the Yum-Mi application. The system handles:
- **Payment Processing**: Secure-Processor Pay integration (Hosted Payment Page API v2)
- **Token Top-ups**: Webhook-based credit additions
- **Token Deductions**: AI generation consumption tracking
- **Transaction History**: Comprehensive payment records

**Tech Stack**: Next.js 14, TypeScript, Prisma ORM, PostgreSQL (Neon), Clerk Auth, Secure-Processor Pay API

---

## 1. Payment Processing System

### 1.1 Payment Flow Entry Points

#### **`/app/api/payment/secure-processor/route.ts`** (Lines 27-175)
**Responsibility**: Creates payment checkout sessions

<function_calls>
<invoke name="grep">
<parameter name="pattern">tracking_id.*gen_user


