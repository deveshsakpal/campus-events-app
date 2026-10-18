import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App renders Student Portal sign in screen', (WidgetTester tester) async {
    await tester.pumpWidget(const CampusEventsApp());

    expect(find.text('Student Portal'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
  });
}
