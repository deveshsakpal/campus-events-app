import 'dart:convert';
import 'package:http/http.dart' as http;

const String defaultApiUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8080',
);

class ApiClient {
  ApiClient({this.token, String? baseUrl}) : baseUrl = baseUrl ?? defaultApiUrl;

  final String? token;
  final String baseUrl;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await http.post(
      _uri(path),
      headers: _headers,
      body: jsonEncode(body),
    );
    final decoded = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(decoded['message'] ?? 'The request failed (${response.statusCode}).');
    }
    return decoded;
  }

  Future<List<Map<String, dynamic>>> getList(String path) async {
    final response = await http.get(_uri(path), headers: _headers);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      var message = 'The request failed (${response.statusCode}).';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded.containsKey('message')) {
          message = decoded['message'] as String;
        }
      } catch (_) {}
      throw Exception(message);
    }
    return (jsonDecode(response.body) as List<dynamic>)
        .cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(_uri(path), headers: _headers);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      var message = 'The request failed (${response.statusCode}).';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded.containsKey('message')) {
          message = decoded['message'] as String;
        }
      } catch (_) {}
      throw Exception(message);
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
