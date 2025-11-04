#!/usr/bin/env node

/**
 * Secure-ProcessorPay Environment Variables Validation Script
 * 
 * Validates all required environment variables for Secure-ProcessorPay integration
 * Run: node scripts/validate-secure-processor-env.js
 */

// Required environment variables
const requiredVars = [
  {
    name: 'SECURE_PROCESSOR_SHOP_ID',
    description: 'Your Secure-ProcessorPay Shop ID',
    example: '29959',
    validator: (val) => val && val.length > 0,
    errorMessage: 'Shop ID must not be empty'
  },
  {
    name: 'SECURE_PROCESSOR_SECRET_KEY',
    description: 'Your Secure-ProcessorPay Secret Key',
    example: 'dbfb6f4e977f49880a6ce3c939f1e7be...',
    validator: (val) => val && val.length >= 32,
    errorMessage: 'Secret Key must be at least 32 characters',
    sensitive: true
  },
  {
    name: 'SECURE_PROCESSOR_API_URL',
    description: 'Secure-ProcessorPay API base URL',
    example: 'https://checkout.secure-processorpay.com',
    validator: (val) => val === 'https://checkout.secure-processorpay.com',
    errorMessage: 'API URL must be https://checkout.secure-processorpay.com',
    warning: (val) => {
      if (val === 'https://gateway.secure-processorpay.com') {
        return '⚠️  WARNING: You are using gateway.secure-processorpay.com which may not work. Use checkout.secure-processorpay.com instead.';
      }
      return null;
    }
  },
  {
    name: 'SECURE_PROCESSOR_TEST_MODE',
    description: 'Enable test mode (true/false)',
    example: 'true',
    validator: (val) => val === 'true' || val === 'false',
    errorMessage: 'Must be "true" or "false"',
    required: false
  }
];

// Optional but recommended
const optionalVars = [
  {
    name: 'NEXT_PUBLIC_SECURE_PROCESSOR_WIDGET_URL',
    description: 'Public-facing widget URL',
    example: 'https://checkout.secure-processorpay.com',
    validator: (val) => !val || val === 'https://checkout.secure-processorpay.com',
    errorMessage: 'If set, must be https://checkout.secure-processorpay.com'
  }
];

/**
 * Validate a single environment variable
 */
function validateVar(varConfig) {
  const value = process.env[varConfig.name];
  const isSet = value !== undefined && value !== '';

  const result = {
    name: varConfig.name,
    isSet,
    value: varConfig.sensitive && value ? `${value.substring(0, 10)}...` : value,
    valid: false,
    error: null,
    warning: null
  };

  if (!isSet && varConfig.required !== false) {
    result.error = 'Not set (required)';
    return result;
  }

  if (!isSet && varConfig.required === false) {
    result.valid = true;
    result.warning = 'Not set (optional)';
    return result;
  }

  if (varConfig.validator && !varConfig.validator(value)) {
    result.error = varConfig.errorMessage || 'Invalid value';
    return result;
  }

  if (varConfig.warning) {
    const warning = varConfig.warning(value);
    if (warning) {
      result.warning = warning;
    }
  }

  result.valid = true;
  return result;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║      Secure-ProcessorPay Environment Variables Validation                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  let allValid = true;
  const results = [];

  // Validate required variables
  console.log('📋 REQUIRED VARIABLES:\n');
  
  requiredVars.forEach((varConfig) => {
    const result = validateVar(varConfig);
    results.push(result);

    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${varConfig.name}`);
    console.log(`   Description: ${varConfig.description}`);
    console.log(`   Example: ${varConfig.example}`);
    
    if (result.isSet) {
      console.log(`   Current: ${result.value}`);
    } else {
      console.log(`   Current: NOT SET`);
    }

    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      allValid = false;
    }

    if (result.warning) {
      console.log(`   ⚠️  Warning: ${result.warning}`);
    }

    console.log('');
  });

  // Validate optional variables
  console.log('\n📋 OPTIONAL VARIABLES:\n');
  
  optionalVars.forEach((varConfig) => {
    const result = validateVar(varConfig);
    results.push(result);

    const status = result.valid ? '✅' : '⚠️';
    console.log(`${status} ${varConfig.name}`);
    console.log(`   Description: ${varConfig.description}`);
    console.log(`   Example: ${varConfig.example}`);
    
    if (result.isSet) {
      console.log(`   Current: ${result.value}`);
    } else {
      console.log(`   Current: NOT SET (optional)`);
    }

    if (result.error) {
      console.log(`   ⚠️  Warning: ${result.error}`);
    }

    if (result.warning) {
      console.log(`   ⚠️  ${result.warning}`);
    }

    console.log('');
  });

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                          SUMMARY                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const requiredValid = results.filter(r => r.valid && r.error === null).length;
  const requiredTotal = requiredVars.filter(v => v.required !== false).length;
  const hasWarnings = results.some(r => r.warning !== null);

  console.log(`Required Variables: ${requiredValid}/${requiredTotal} valid`);

  if (allValid) {
    console.log('\n✅ All required environment variables are set and valid!\n');
    
    if (hasWarnings) {
      console.log('⚠️  Note: There are some warnings above. Please review them.\n');
    }

    console.log('✅ Next Steps:');
    console.log('   1. Run the integration test: node scripts/test-secure-processor-integration.js');
    console.log('   2. Deploy to Vercel with these environment variables');
    console.log('   3. Test the payment flow end-to-end');
    console.log('');
  } else {
    console.log('\n❌ Some required environment variables are missing or invalid!\n');
    console.log('🔧 How to fix:');
    console.log('   1. Create a .env.local file in the project root');
    console.log('   2. Add the missing/invalid variables');
    console.log('   3. Run this script again to validate');
    console.log('   4. Example .env.local:');
    console.log('');
    console.log('      # Secure-ProcessorPay Configuration');
    requiredVars.forEach(v => {
      console.log(`      ${v.name}=${v.example}`);
    });
    console.log('');
  }

  // Check for common mistakes
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    COMMON MISTAKES CHECK                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const apiUrl = process.env.SECURE_PROCESSOR_API_URL;
  const mistakes = [];

  if (apiUrl === 'https://gateway.secure-processorpay.com') {
    mistakes.push({
      issue: 'Wrong API URL',
      current: apiUrl,
      correct: 'https://checkout.secure-processorpay.com',
      severity: 'ERROR'
    });
  }

  if (apiUrl && !apiUrl.startsWith('https://')) {
    mistakes.push({
      issue: 'API URL not using HTTPS',
      current: apiUrl,
      correct: 'Must start with https://',
      severity: 'ERROR'
    });
  }

  const testMode = process.env.SECURE_PROCESSOR_TEST_MODE;
  if (testMode && testMode !== 'true' && testMode !== 'false') {
    mistakes.push({
      issue: 'Invalid test mode value',
      current: testMode,
      correct: '"true" or "false"',
      severity: 'WARNING'
    });
  }

  if (mistakes.length === 0) {
    console.log('✅ No common mistakes found!\n');
  } else {
    mistakes.forEach((mistake, index) => {
      const icon = mistake.severity === 'ERROR' ? '❌' : '⚠️';
      console.log(`${icon} Mistake ${index + 1}: ${mistake.issue}`);
      console.log(`   Current: ${mistake.current}`);
      console.log(`   Should be: ${mistake.correct}\n`);
    });
  }

  // Vercel deployment check
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    VERCEL DEPLOYMENT                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('📝 To deploy to Vercel with these environment variables:\n');
  console.log('   1. Go to your Vercel project settings');
  console.log('   2. Navigate to Environment Variables');
  console.log('   3. Add each variable below:');
  console.log('');

  requiredVars.forEach(varConfig => {
    const value = process.env[varConfig.name];
    if (value) {
      console.log(`      ${varConfig.name} = ${varConfig.sensitive ? '[YOUR_SECRET_KEY]' : value}`);
    } else {
      console.log(`      ${varConfig.name} = ${varConfig.example}`);
    }
  });

  console.log('');
  console.log('   4. Save and redeploy');
  console.log('');

  return allValid;
}

// Run validation
try {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}

