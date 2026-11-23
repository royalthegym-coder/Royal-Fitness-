import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Initialize Supabase
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fitness Future App',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final supabase = Supabase.instance.client;
  String dietPlan = "No plan generated yet.";

  // 2. Call Python API directly (or via Supabase Edge Function)
  Future<void> generateDietPlan() async {
    try {
      final response = await http.post(
        Uri.parse('YOUR_PYTHON_BACKEND_URL/api/generate-diet'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': supabase.auth.currentUser?.id ?? 'test_user',
          'weight': 75.0,
          'height': 180.0,
          'goal': 'Muscle Gain'
        }),
      );

      if (response.statusCode == 200) {
        setState(() {
          dietPlan = jsonDecode(response.body)['data']['plan_data'].toString();
        });
      } else {
        throw Exception('Failed to load diet plan');
      }
    } catch (e) {
      print('Error generating diet plan: $e');
    }
  }

  // 3. Listen to Supabase Realtime Database Changes
  @override
  void initState() {
    super.initState();
    supabase.from('diet_plans').stream(primaryKey: ['id']).listen((List<Map<String, dynamic>> data) {
      if (data.isNotEmpty) {
        setState(() {
          dietPlan = data.last['plan_data'].toString();
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fitness Future Dashboard')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Your Diet Plan: $dietPlan'),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: generateDietPlan,
              child: const Text('Generate AI Diet Plan'),
            ),
          ],
        ),
      ),
    );
  }
}
